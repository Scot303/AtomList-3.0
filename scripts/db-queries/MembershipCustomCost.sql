SELECT m.Id, m.custom_monthly_cost, (SELECT name || ' ' || last_name FROM persons WHERE Id = m.person_id) AS person_name
FROM memberships m
WHERE custom_monthly_cost IS NOT NULL;