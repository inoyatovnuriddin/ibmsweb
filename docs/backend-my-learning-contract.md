# My Learning Frontend Contract

Bu hujjat `/user-profile/my-learning` sahifasi uchun frontend kutayotgan backend contractni tavsiflaydi.

Sahifa maqsadi:

- foydalanuvchining barcha boshlangan kurslarini ko‘rsatish
- faol o‘qishlarni alohida ko‘rsatish
- tugallangan kurslar tarixini ko‘rsatish
- keyinchalik sertifikatlar bo‘limini ulash

## Frontenddagi bo‘limlar

Sahifada quyidagi tablar bor:

- `Umumiy`
- `Faol o‘qish`
- `Tarix`
- `Sertifikatlar`

`Sertifikatlar` hozircha placeholder bo‘lib turadi. Backend keyinroq qo‘shilishi mumkin.

---

## Tavsiya etilgan endpointlar

### 1. Mening kurslarim progressi

```http
GET /api/v1/lms/progress/my/courses
Authorization: Bearer <jwt>
```

### Tavsiya etilgan response

```json
{
  "status": "Ok",
  "statusCode": 200,
  "payload": {
    "list": [
      {
        "courseId": "uuid-course-1",
        "courseTitle": "Avtomobil elektrigi",
        "instructor": "Mirzojon",
        "status": "IN_PROGRESS",
        "progressPercent": 45,
        "startedAt": "2026-04-27T10:00:00",
        "completedAt": null
      },
      {
        "courseId": "uuid-course-2",
        "courseTitle": "Elektr xavfsizligi",
        "instructor": "Dilshod",
        "status": "COMPLETED",
        "progressPercent": 100,
        "startedAt": "2026-04-20T09:00:00",
        "completedAt": "2026-04-25T16:30:00"
      }
    ],
    "count": 2
  }
}
```

### Frontend uchun muhim fieldlar

- `courseId`
- `courseTitle`
- `instructor`
- `status`
- `progressPercent`
- `startedAt`
- `completedAt`

### Status mapping

Frontend quyidagi statuslarni kutadi:

- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`
- `FAILED`

UI’da ular quyidagicha ko‘rsatiladi:

- `NOT_STARTED` -> `Boshlanmagan`
- `IN_PROGRESS` -> `Faol o‘qish`
- `COMPLETED` -> `Yakunlangan`
- `FAILED` -> `Yakunlanmagan`

---

### 2. Kursni davom ettirish uchun detail sahifa

Frontend kartadagi `Davom ettirish` yoki `Ko‘rish` tugmasi orqali kurs detail sahifasiga o‘tadi:

```http
GET /api/v1/course/one?id={courseId}
```

### Tavsiya etilgan response

```json
{
  "status": "Ok",
  "statusCode": 200,
  "payload": {
    "id": "uuid-course-1",
    "titleuz": "Avtomobil elektrigi",
    "titleru": "Avtomobil elektrigi",
    "descriptionuz": "Kurs tavsifi",
    "descriptionru": "Kurs tavsifi",
    "instructor": "Mirzojon"
  }
}
```

Bu endpoint sahifa ichidagi kurs title/tavsifini boyitish uchun ishlatilishi mumkin, lekin `Mening o‘qishlarim` kartalarini chizish uchun majburiy emas.

Agar `courseTitle` va `instructor` allaqachon `my/courses` ichida qaytsa, frontend uchun bu eng qulay variant bo‘ladi.

---

## Filter va sort uchun frontend kutayotgan mantiq

Frontend quyidagicha ishlaydi:

- `Umumiy` tab -> barcha kurslar
- `Faol o‘qish` -> `IN_PROGRESS` va kerak bo‘lsa `NOT_STARTED`
- `Tarix` -> `COMPLETED` va `FAILED`

Sort uchun frontend local holda quyidagilarni ishlatadi:

- `recent` -> `startedAt` yoki `completedAt` asosida
- `progress` -> `progressPercent`

Shu sabab `startedAt` va `completedAt` fieldlari iloji boricha qaytarilishi tavsiya etiladi.

---

## Tavsiya etilgan response wrapper

Project bo‘yicha wrapper ishlatilgani uchun frontend quyidagi formatni kutadi:

```json
{
  "status": "Ok",
  "statusCode": 200,
  "payload": {}
}
```

---

## Empty state holati

Agar foydalanuvchida kurslar bo‘lmasa:

```json
{
  "status": "Ok",
  "statusCode": 200,
  "payload": {
    "list": [],
    "count": 0
  }
}
```

Frontend bu holatda:

- `Hozircha kurslar topilmadi`
- yoki `Faol o‘qishlar hozircha yo‘q`

ko‘rinishidagi empty state chiqaradi.

---

## Unauthorized va forbidden holatlar

### Unauthorized

```json
{
  "status": "Unauthorized",
  "statusCode": 401,
  "message": "Autentifikatsiya talab qilinadi"
}
```

Frontend bu holatda foydalanuvchini login sahifasiga qaytaradi.

### Forbidden

```json
{
  "status": "Forbidden",
  "statusCode": 403,
  "message": "Ruxsat berilmagan"
}
```

Bu endpoint odatda current userning o‘z kurslari uchun ishlatilgani sabab `403` kam bo‘lishi kerak, lekin baribir frontend safe fallback ko‘rsatadi.

---

## Frontend oqimi

`/user-profile/my-learning` sahifasi ochilganda frontend:

1. `GET /api/v1/lms/progress/my/courses`
2. response ichidagi kurslarni tablar bo‘yicha ajratadi
3. kartalarda:
   - kurs nomi
   - o‘qituvchi
   - status
   - progress
   - davom ettirish tugmasi
   ni ko‘rsatadi

Tugma bosilganda:

```text
/course/{courseId}
```

ga o‘tadi.

---

## Backend uchun tavsiya

Frontendni soddaroq qilish uchun quyidagilarni aynan `my/courses` response ichida qaytarish tavsiya etiladi:

- `courseTitle`
- `instructor`
- `status`
- `progressPercent`
- `startedAt`
- `completedAt`

Shunda frontend alohida `course/one` bilan kartalarni boyitishga muhtoj bo‘lmaydi va sahifa tezroq ishlaydi.
