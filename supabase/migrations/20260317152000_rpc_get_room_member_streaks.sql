-- Create an RPC to fetch top habit streaks for all members in a given room
CREATE OR REPLACE FUNCTION public.get_room_members_top_streaks(p_room_id UUID)
RETURNS TABLE (user_id UUID, top_streak integer) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE
  -- 1. Get members
  room_users AS (
    SELECT rm.user_id FROM public.room_members rm WHERE rm.room_id = p_room_id
  ),
  -- 2. Get completed logs
  distinct_logs AS (
    SELECT hl.user_id, hl.habit_id, hl.date
    FROM public.habit_logs hl
    JOIN room_users ru ON hl.user_id = ru.user_id
    WHERE hl.is_completed = true
    GROUP BY hl.user_id, hl.habit_id, hl.date
  ),
  -- 3. Rank logs
  ranked_logs AS (
    SELECT 
      dl.user_id,
      dl.habit_id, 
      dl.date,
      dense_rank() OVER (PARTITION BY dl.user_id, dl.habit_id ORDER BY dl.date DESC) as rnk
    FROM distinct_logs dl
  ),
  -- 4. Calculate streaks recursively
  streak_calc AS (
    -- Base case
    SELECT 
      rl.user_id,
      rl.habit_id,
      rl.date,
      rl.rnk,
      1 as current_streak,
      (rl.date >= current_date - interval '1 day') as is_valid_streak
    FROM ranked_logs rl
    WHERE rl.rnk = 1
    
    UNION ALL
    
    -- Recursive step
    SELECT 
      sc.user_id,
      sc.habit_id,
      rl.date,
      rl.rnk,
      sc.current_streak + 1 as current_streak,
      sc.is_valid_streak
    FROM streak_calc sc
    JOIN ranked_logs rl ON sc.user_id = rl.user_id AND sc.habit_id = rl.habit_id AND sc.rnk + 1 = rl.rnk
    WHERE rl.date = sc.date - interval '1 day' AND sc.is_valid_streak = true
  ),
  -- 5. Get top streak per user
  user_max_streaks AS (
    SELECT 
      sc.user_id, 
      MAX(sc.current_streak)::integer as max_streak
    FROM streak_calc sc
    WHERE sc.is_valid_streak = true
    GROUP BY sc.user_id
  )
  -- 6. Left join to ensure all members are returned even with 0 streak
  SELECT 
    ru.user_id,
    COALESCE(ums.max_streak, 0) as top_streak
  FROM room_users ru
  LEFT JOIN user_max_streaks ums ON ru.user_id = ums.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
