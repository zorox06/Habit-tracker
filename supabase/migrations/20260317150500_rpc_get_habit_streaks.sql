-- Create an RPC function to calculate current streaks for all habits of a user
-- A streak is the number of consecutive days up to today (or yesterday) that a habit has been logged as completed.

CREATE OR REPLACE FUNCTION public.get_habit_streaks(p_user_id UUID)
RETURNS TABLE (habit_id UUID, streak integer) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE
  -- 1. Get all completed logs for the user, grouped by habit and date (to handle multiple logs per day)
  distinct_logs AS (
    SELECT hl.habit_id, hl.date
    FROM public.habit_logs hl
    WHERE hl.user_id = p_user_id AND hl.is_completed = true
    GROUP BY hl.habit_id, hl.date
  ),
  -- 2. Number the logs for each habit in descending order of date
  ranked_logs AS (
    SELECT 
      dl.habit_id, 
      dl.date,
      dense_rank() OVER (PARTITION BY dl.habit_id ORDER BY dl.date DESC) as rnk
    FROM distinct_logs dl
  ),
  -- 3. Calculate streaks by checking consecutive dates
  streak_calc AS (
    -- Base case: Most recent log for each habit
    SELECT 
      rl.habit_id,
      rl.date,
      rl.rnk,
      1 as current_streak,
      -- A streak is valid if the most recent log is today or yesterday
      (rl.date >= current_date - interval '1 day') as is_valid_streak
    FROM ranked_logs rl
    WHERE rl.rnk = 1
    
    UNION ALL
    
    -- Recursive step: Check if the previous day has a log
    SELECT 
      sc.habit_id,
      rl.date,
      rl.rnk,
      sc.current_streak + 1 as current_streak,
      sc.is_valid_streak
    FROM streak_calc sc
    JOIN ranked_logs rl ON sc.habit_id = rl.habit_id AND sc.rnk + 1 = rl.rnk
    WHERE rl.date = sc.date - interval '1 day' AND sc.is_valid_streak = true
  )
  -- 4. Get the max streak for each habit that has a valid streak
  SELECT 
    sc.habit_id, 
    MAX(sc.current_streak)::integer as streak
  FROM streak_calc sc
  WHERE sc.is_valid_streak = true
  GROUP BY sc.habit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
