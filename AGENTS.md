# Architecture rules
- Store the landing link label and destination as localized UI text settings in the existing app_settings table; this preserves deployment compatibility without schema changes.
- Store image engagement as analytics event payloads rather than dedicated columns; this keeps analytics extensible without schema changes.
- Store coarse visitor context as analytics event payloads and never persist IP addresses or precise locations; this keeps traffic insights privacy-conscious without schema changes.
- Embed the small default capacity icon as a data URL, retaining its asset pointer; this avoids a startup request and works on self-hosted deployments while admin overrides load separately.