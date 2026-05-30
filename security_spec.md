# Firestore Security Specification

## 1. Data Invariants & Zero-Trust Assertions
1. **Multi-User Partitioning**: Users should only have read/write access to resources containing their exact `userId` field matching `request.auth.uid`. No user can view or alter another candidate's prep topics, mistakes, or job applications.
2. **Temporal Integrity**: Fields track creation timestamps (`createdAt` and `updatedAt`). These must align with `request.time`.
3. **Immutable Identity Links**: Documents, once bound to a `userId` during creation, must not allow `userId` changing or transfer of ownership.
4. **Data Size Bounds**: Strings (like questions, answers, notes, audioUrls) must have an explicit `.size() <= N` block to protect our cloud resources against "Denial of Wallet" size-bloat exploits.

---

## 2. The "Dirty Dozen" Threat Vectors Check
Below are 12 specific payloads designed to challenge user authentication, identity spoofing, and privilege escalation:

| Vector ID | Target Collection | Payload Context | Expected Result |
| :--- | :--- | :--- | :--- |
| **V1** | `/users/user-abc` | Non-authenticated user attempts profile creation | `PERMISSION_DENIED` |
| **V2** | `/users/user-abc` | User `user-def` attempts to write into `user-abc` path | `PERMISSION_DENIED` |
| **V3** | `/topics/topic-1` | Attempting to create a topic where input `userId` mismatch with auth uid | `PERMISSION_DENIED` |
| **V4** | `/topics/topic-1` | Attempting to bypass schema verification by sending 5MB string in topic name | `PERMISSION_DENIED` |
| **V5** | `/topics/topic-1` | Attempting to update `userId` owner link post-creation | `PERMISSION_DENIED` |
| **V6** | `/questions/q-1` | Creating practice question referencing another user's `userId` | `PERMISSION_DENIED` |
| **V7** | `/interviews/int-1` | Creating completed interview with fake future `date` or unverified status | `PERMISSION_DENIED` |
| **V8** | `/mistakes/m-1` | Appending a "Ghost Field" of system admin configurations during post creation | `PERMISSION_DENIED` |
| **V9** | `/studySessions/ss-1` | Spoofing duration to be negative or non-integer | `PERMISSION_DENIED` |
| **V10** | `/voiceRecordings/rec-1` | Creating recording entry with malicious binary blob injection as url | `PERMISSION_DENIED` |
| **V11** | `/intelliQuestions/iq-1` | Unauthenticated public browser attempting to query intelligence database | `PERMISSION_DENIED` |
| **V12** | `/notifications/n-1` | Insecure list query trying to read ALL global users' notification records | `PERMISSION_DENIED` |

---

## 3. Fortress Rule Architecture Design
The compiled `firestore.rules` will explicitly:
- Restrict read / list / get patterns to standard relational filters (`resource.data.userId == request.auth.uid`).
- Implement helper schema validations (`isValidTopic()`, `isValidQuestion()`, `isValidInterview()`, `isValidMistake()`, `isValidJobApplication()`, `isValidStudySession()`, `isValidVoiceRecording()`, `isValidNotification()`, `isValidIntelliQuestion()`).
- Verify email authentication using `request.auth.token.email_verified == true`.
