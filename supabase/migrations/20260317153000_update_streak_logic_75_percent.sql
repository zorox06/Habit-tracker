-- Update the RPC to correctly fetch top habit streaks based on the 75% completion rule.
-- The calculation must evaluate a user's GLOBAL planned time (all active habits they own/are assigned to)
-- against their GLOBAL completed time for each day, as users are measured by their total discipline.

CREATE OR REPLACE FUNCTION public.get_room_members_top_streaks(p_room_id UUID)
RETURNS TABLE (user_id UUID, top_streak integer) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE
  -- 1. Get members of the room
  room_users AS (
    SELECT rm.user_id FROM public.room_members rm WHERE rm.room_id = p_room_id
  ),
  
  -- 2. Daily planned time per user (from all their personal active habits + room habits they are part of)
  -- To keep it aligned with how the user views their dashboard, we sum up target duration 
  -- of all active habits they own.
  user_planned_time AS (
    SELECT 
      ru.user_id,
      COALESCE(SUM(COALESCE(h.target_duration_minutes, 60)), 0)::numeric as planned_minutes
    FROM room_users ru
    LEFT JOIN public.habits h ON h.user_id = ru.user_id AND h.status = 'active'
    GROUP BY ru.user_id
  ),
  
  -- 3. Total completed time per user per day from all their habit logs
  daily_completions AS (
    SELECT 
      hl.user_id, 
      hl.date,
      SUM(hl.duration_minutes)::numeric as completed_minutes
    FROM public.habit_logs hl
    JOIN room_users ru ON hl.user_id = ru.user_id
    GROUP BY hl.user_id, hl.date
  ),
  
  -- 4. Filter for valid days (>= 75% completion based on current planned time)
  valid_days AS (
    SELECT 
      dc.user_id,
      dc.date
    FROM daily_completions dc
    JOIN user_planned_time upt ON dc.user_id = upt.user_id
    WHERE upt.planned_minutes > 0 
      AND (dc.completed_minutes / upt.planned_minutes) * 100 >= 75
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
