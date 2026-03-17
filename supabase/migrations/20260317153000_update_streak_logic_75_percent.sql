-- Update the RPC to fetch top habit streaks based on the new 75% completion rule
-- A streak only continues if the user has completed >= 75% of the total target duration 
-- of all shared habits in the room for a given day.

CREATE OR REPLACE FUNCTION public.get_room_members_top_streaks(p_room_id UUID)
RETURNS TABLE (user_id UUID, top_streak integer) AS $$
DECLARE
  v_total_planned_minutes integer := 0;
BEGIN
  -- 1. Get the total planned time for all habits in this room
  -- Assumes a default of 60 minutes if target_duration_minutes is null
  SELECT COALESCE(SUM(COALESCE(target_duration_minutes, 60)), 0)
  INTO v_total_planned_minutes
  FROM public.habits
  WHERE room_id = p_room_id AND status = 'active';

  -- If there are no habits, everyone has a 0 streak
  IF v_total_planned_minutes = 0 THEN
    RETURN QUERY 
    SELECT rm.user_id, 0::integer 
    FROM public.room_members rm 
    WHERE rm.room_id = p_room_id;
    RETURN;
  END IF;

  RETURN QUERY
  WITH RECURSIVE
  -- 2. Get members
  room_users AS (
    SELECT rm.user_id FROM public.room_members rm WHERE rm.room_id = p_room_id
  ),
  
  -- 3. Calculate total completed time per user per day for room habits
  daily_completions AS (
    SELECT 
      hl.user_id, 
      hl.date,
      SUM(hl.duration_minutes) as total_completed_minutes
    FROM public.habit_logs hl
    JOIN public.habits h ON hl.habit_id = h.id
    JOIN room_users ru ON hl.user_id = ru.user_id
    WHERE h.room_id = p_room_id
    GROUP BY hl.user_id, hl.date
  ),
  
  -- 4. Filter for days where completion is >= 75%
  valid_days AS (
    SELECT 
      dc.user_id,
      dc.date
    FROM daily_completions dc
    -- Standard percentage calculation: (completed / planned) * 100 >= 75
    WHERE (dc.total_completed_minutes::numeric / v_total_planned_minutes::numeric) * 100 >= 75
  ),
  
  -- 5. Rank the valid days to find consecutive streaks
  ranked_days AS (
    SELECT 
      vd.user_id,
      vd.date,
      dense_rank() OVER (PARTITION BY vd.user_id ORDER BY vd.date DESC) as rnk
    FROM valid_days vd
  ),
  
  -- 6. Calculate streaks recursively
  streak_calc AS (
    -- Base case: The streak must start either today or yesterday to be active
    SELECT 
      rd.user_id,
      rd.date,
      rd.rnk,
      1 as current_streak,
      (rd.date >= current_date - interval '1 day') as is_valid_starting_point
    FROM ranked_days rd
    WHERE rd.rnk = 1
    
    UNION ALL
    
    -- Recursive step: If the previous ranked day is exactly 1 day before the current, add to streak
    SELECT 
      sc.user_id,
      rd.date,
      rd.rnk,
      sc.current_streak + 1 as current_streak,
      sc.is_valid_starting_point
    FROM streak_calc sc
    JOIN ranked_days rd ON sc.user_id = rd.user_id AND sc.rnk + 1 = rd.rnk
    WHERE rd.date = sc.date - interval '1 day' AND sc.is_valid_starting_point = true
  ),
  
  -- 7. Get the max streak per user
  user_max_streaks AS (
    SELECT 
      sc.user_id, 
      MAX(sc.current_streak)::integer as max_streak
    FROM streak_calc sc
    WHERE sc.is_valid_starting_point = true
    GROUP BY sc.user_id
  )
  
  -- 8. Final select joining all room members (defaulting to 0)
  SELECT 
    ru.user_id,
    COALESCE(ums.max_streak, 0) as top_streak
  FROM room_users ru
  LEFT JOIN user_max_streaks ums ON ru.user_id = ums.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
