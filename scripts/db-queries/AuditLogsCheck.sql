SELECT (Select u.username FROM users u WHERE Id = ae.actor_id), ae.occurred_at, ae.message, ae.type
FROM audit_events ae
WHERE ae.type IN ('MEMBERSHIP_MANAGEMENT')
  AND target_id IN (Select m.person_id FROM memberships m WHERE custom_monthly_cost IS NOT NULL)
ORDER BY occurred_at desc;