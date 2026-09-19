# Kissflow APIs (from employee + approver dashboards)

All dashboard HTTP goes through `kf.api(...)`. Auth = Kissflow session. App id: `Expense_and_Travel_Management_A00`.

## Processes

| Domain | Process ID | Report (All Items) | Employee create popup |
|--------|------------|--------------------|------------------------|
| Travel | `Travel_Management_A02` | `All_Items_A00` | `Popup_rCILSrY8KF` |
| Advance | `Advance_Payment_Request_Process_A01` | `ALL_ITEMS_WITH_TABLE_A00` | `Popup_J0C5lIdWCL` |
| Expense | `Expense_Management_A03` | `All_Items_MK_A00` | `Popup_E4xarw8lLE` |

## Endpoints

### Process report (employee lists / enrich)

```
GET /process-report/2/{accountId}/{processId}/{reportId}?_application_id={APP_ID}&page_number=1&page_size=2000
GET ...&$status=Completed   # trends
```

### Pending / my items (approver inbox + activity ids)

```
GET /process/2/{accountId}/{processId}/pending/activity/count?_application_id={APP_ID}
GET /process/2/{accountId}/{processId}/pending/{activityId}?_application_id={APP_ID}&page_number=&page_size=
GET /process/2/{accountId}/{processId}/myitems?apply_preference=true&skip_aggregation=true&_application_id={APP_ID}&page_number=&page_size=
```

### Preference (approver only — force columns)

```
POST /common/2/{accountId}/preference/{processId}/WorkflowStep/{viewId}/?_application_id={APP_ID}
Body: { AppId, ViewId, ViewType: "WorkflowStep", ConfigJson: { Columns: [{Id, Model}], Filter: {}, Sort: [] } }
```

### User / flow discovery

```
GET /user/2/{accountId}/{userId}
GET /flow/2/{accountId}/process?_application_id={applicationId}
GET /flow/2/{accountId}/process/{processId}/report?_application_id={applicationId}
```

### Navigation (SDK, not REST)

```
kf.app.page.openPopup(popupId)
kf.app.page.openPopup(popupId, { InstanceId, ActivityId, ActivityInstanceId, width, height })
kf.app.openPage(pageId)
```

## External booking API (form fields only)

```
POST https://refex-tms-flightsearch-dhwffeu7pq-el.a.run.app/api/flights/search
GET  https://refex-tms-flightsearch-dhwffeu7pq-el.a.run.app/api/airports?q=
```

Used by this travel-booking form field and `refex-tms-flightsearch-kf-component`.

## Employee vs Approver

| | Employee | Approver |
|--|----------|----------|
| List source | process-report + email filter | pending + assignment filter |
| Preference POST | No | Yes |
| Create | openPopup (empty) | openPopup with instance (approve) |
