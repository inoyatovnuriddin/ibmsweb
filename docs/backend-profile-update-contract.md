# Self Profile Update Contract

Bu hujjat `/user-profile/details` sahifasidagi foydalanuvchi profilini tahrirlash uchun frontend kutayotgan backend contractni tavsiflaydi.

## Maqsad

Foydalanuvchi o‘z profil ma’lumotlarini input orqali o‘zgartira olishi kerak:

- ism
- familiya
- sharif
- email
- telefon raqam
- tug‘ilgan sana
- passport seriya va raqami

Frontend bu sahifada password o‘zgartirmaydi. Password oqimi alohida security page yoki alohida endpoint orqali boshqarilishi tavsiya etiladi.

## Tavsiya etilgan endpointlar

### 1. Joriy foydalanuvchini olish

```http
GET /api/auth/me
Authorization: Bearer <jwt>
```

### Response

```json
{
  "id": "uuid",
  "email": "ali@example.com",
  "phoneNumber": "+998901234567",
  "birthDate": "2000-01-01",
  "passportId": "AA1234567",
  "firstName": "Ali",
  "lastName": "Valiyev",
  "middleName": "Aliyevich",
  "authProvider": "LOCAL",
  "status": "Active",
  "passwordLoginEnabled": true,
  "profileCompleted": true,
  "roles": ["ROLE_USER"]
}
```

Frontend shu response orqali formani to‘ldiradi.

---

### 2. Joriy foydalanuvchi profilini yangilash

Tavsiya etilgan yangi endpoint:

```http
PUT /api/auth/me
Authorization: Bearer <jwt>
Content-Type: application/json
```

### Request body

```json
{
  "firstname": "Ali",
  "lastname": "Valiyev",
  "middlename": "Aliyevich",
  "email": "ali@example.com",
  "phoneNumber": "+998901234567",
  "birthDate": "2000-01-01",
  "passportId": "AA1234567"
}
```

### Field qoidalari

- `firstname`: required
- `lastname`: required
- `middlename`: optional
- `email`: required
- `phoneNumber`: optional, lekin bo‘sh bo‘lsa `null` qaytarilishi mumkin
- `birthDate`: optional, format `YYYY-MM-DD`
- `passportId`: optional

Frontend bu endpointga:

- `roles`
- `status`
- `changePassword`
- `password`

kabi admin yoki securityga oid fieldlarni yubormasligi kerak.

---

## Wrapper bilan response tavsiyasi

Agar project bo‘yicha barcha endpointlar wrapper ishlatsa, quyidagi format tavsiya etiladi:

```json
{
  "status": "Ok",
  "statusCode": 200,
  "payload": {
    "id": "uuid",
    "email": "ali@example.com",
    "phoneNumber": "+998901234567",
    "birthDate": "2000-01-01",
    "passportId": "AA1234567",
    "firstName": "Ali",
    "lastName": "Valiyev",
    "middleName": "Aliyevich",
    "authProvider": "LOCAL",
    "status": "Active",
    "passwordLoginEnabled": true,
    "profileCompleted": true,
    "roles": ["ROLE_USER"]
  }
}
```

Frontend uchun muhim fieldlar:

- `id`
- `email`
- `phoneNumber`
- `birthDate`
- `passportId`
- `firstName`
- `lastName`
- `middleName`
- `authProvider`
- `status`
- `passwordLoginEnabled`
- `profileCompleted`
- `roles`

---

## Xatolik response tavsiyasi

### Validation xatosi

```json
{
  "status": "Bad Request",
  "statusCode": 400,
  "message": "Validation error",
  "errors": {
    "email": "Email format noto‘g‘ri",
    "birthDate": "Sana formati noto‘g‘ri"
  }
}
```

### Duplicate email

```json
{
  "status": "Bad Request",
  "statusCode": 400,
  "message": "Bu email allaqachon ishlatilgan"
}
```

### Duplicate phone

```json
{
  "status": "Bad Request",
  "statusCode": 400,
  "message": "Bu telefon raqam allaqachon ishlatilgan"
}
```

### Unauthorized

```json
{
  "status": "Unauthorized",
  "statusCode": 401,
  "message": "Autentifikatsiya talab qilinadi"
}
```

---

## Frontend behavior

Frontend quyidagicha ishlaydi:

1. Page ochilganda `GET /api/auth/me`
2. Form current user bilan to‘ldiriladi
3. `Saqlash` bosilganda `PUT /api/auth/me`
4. Success bo‘lsa:
   - yangi user ma’lumoti storega yoziladi
   - header/sidebar darhol yangilanadi
   - `Profil ma’lumotlari saqlandi` xabari ko‘rsatiladi

---

## Hozirgi vaqtinchalik moslik

Frontend hozircha mavjud admin update endpoint bilan ham ishlay oladi:

```http
PUT /api/v1/users/{userId}
```

Lekin product nuqtai nazaridan self-service profil uchun tavsiya etilgan toza endpoint:

```http
PUT /api/auth/me
```

Bu oddiy foydalanuvchi profilini yangilash oqimini admin user update endpointidan ajratib beradi.
