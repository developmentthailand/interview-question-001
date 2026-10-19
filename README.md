# ข้อสอบข้อ 1: ระบบรายชื่อบุคลากร

เว็บแอปสำหรับดูรายชื่อ เพิ่มบุคลากร และเปิดดูรายละเอียดแบบอ่านอย่างเดียว แยก API และ Angular ไว้ในโฟลเดอร์เดียวกันตามโครงสร้างข้อสอบ

## เทคโนโลยี

- Backend: ASP.NET Core Web API บน .NET 10 และ EF Core 10
- Database: SQLite พร้อม EF Core migrations
- Frontend: Angular 22 แบบ standalone และ strict TypeScript
- Tests: xUnit สำหรับ API integration tests และ Vitest สำหรับ Angular
- Package: `@example-com/interview-question-001`
- ตัวอย่าง site identity ในเอกสาร: `interview-question-001.example.com`

## ขอบเขตและกติกาข้อมูล

- ตารางแสดงรหัส ชื่อ-นามสกุล ที่อยู่ วันเกิด อายุ และปุ่มดูรายละเอียด
- เพิ่มข้อมูลผ่าน modal; ยกเลิกแล้วไม่เรียก API; บันทึกสำเร็จจึงเพิ่มข้อมูลตอบกลับจาก API ต่อท้ายตาราง
- รายละเอียดเป็นแบบอ่านอย่างเดียว
- อายุคำนวณด้วย `ปีปัจจุบัน - ปีเกิด` ตามโจทย์ และไม่บันทึกอายุลงฐานข้อมูล
- เก็บวันเกิดแบบ `DateOnly` / `YYYY-MM-DD` และแสดงเป็น `dd/MM/yyyy` โดยไม่แปลง timezone
- ชื่อ นามสกุล วันเกิด และที่อยู่เป็นข้อมูลบังคับ; ปฏิเสธวันเกิดในอนาคตทั้ง client และ server
- ข้อมูลตัวอย่าง 9 รายการเป็นข้อมูลสมมติและ seed เฉพาะ Development เมื่อฐานข้อมูลยังว่าง
- ไม่มีแก้ไข ลบ ระบบสมาชิก หรือ deployment ตามขอบเขตข้อ 1

## โครงสร้าง

```text
backend/
  PersonDirectory.Api/
    Controllers/
    Contracts/
    Data/
    Entities/
    Data/Migrations/
tests/
  backend/PersonDirectory.Api.Tests/
frontend/
  src/app/models/
  src/app/person-dialog/
  src/app/person-directory/
  src/app/services/
  src/app/utils/
```

## สิ่งที่ต้องติดตั้ง

- .NET SDK 10.0
- Node.js 22.22.3 และ npm 10.9.8 ขึ้นไปในสาย 10

## เริ่มใช้งานในเครื่อง

เปิด terminal แรกที่โฟลเดอร์ `interview-question-001` แล้วเริ่ม API:

```powershell
dotnet run --project backend/PersonDirectory.Api/PersonDirectory.Api.csproj --launch-profile http
```

API ใช้ `http://localhost:5080` และจะ apply migrations เมื่อเริ่มทำงาน ฐานข้อมูล `backend/PersonDirectory.Api/person-directory.db` ถูกสร้างในเครื่องและถูก ignore ใน Git

เปิด terminal ที่สอง:

```powershell
cd frontend
npm ci
npm start
```

เปิด `http://localhost:4200` Angular development proxy ส่ง `/api` ไปที่ API port 5080

## API

| Method | Path | รายละเอียด |
| --- | --- | --- |
| `GET` | `/api/persons` | รายชื่อเรียงตามรหัสจากน้อยไปมาก |
| `GET` | `/api/persons/{id}` | รายละเอียดบุคลากร หรือ Problem Details 404 |
| `POST` | `/api/persons` | ตรวจข้อมูลและสร้างรายการใหม่ ตอบ `201 Created` |

ตัวอย่าง request สำหรับสร้างรายการ:

```json
{
  "firstName": "Mali",
  "lastName": "Sukjai",
  "dateOfBirth": "1985-12-31",
  "address": "Bangkok"
}
```

## Migrations

Local EF tool manifest อยู่ที่ `backend/dotnet-tools.json` ใช้คำสั่งต่อไปนี้จากโฟลเดอร์ `backend` เมื่อต้องเพิ่ม migration:

```powershell
dotnet tool restore
dotnet tool run dotnet-ef migrations add <MigrationName> --project PersonDirectory.Api/PersonDirectory.Api.csproj --startup-project PersonDirectory.Api/PersonDirectory.Api.csproj --output-dir Data/Migrations
```

API จะ apply migration ให้อัตโนมัติเมื่อเริ่มทำงาน; สามารถ apply ด้วยคำสั่ง `dotnet tool run dotnet-ef database update` จากโฟลเดอร์ `backend` ได้เช่นกัน โดยระบุ `--project` และ `--startup-project` เป็น `PersonDirectory.Api/PersonDirectory.Api.csproj`

## Tests และ build

รันจากโฟลเดอร์ `interview-question-001`:

```powershell
dotnet test tests/backend/PersonDirectory.Api.Tests/PersonDirectory.Api.Tests.csproj -c Release
dotnet build backend/PersonDirectory.Api/PersonDirectory.Api.csproj -c Release
```

รันจาก `frontend`:

```powershell
npm test -- --watch=false
npm run build
```

API integration tests ใช้ SQLite in-memory แยกต่อ test factory และไม่ใช้ข้อมูล seed ใน Development

## แนวทางด้านคุณภาพและประสิทธิภาพ

- API query เป็น async พร้อม cancellation token, ใช้ `AsNoTracking`, projection เป็น response DTO และเรียงลำดับในฐานข้อมูล
- Angular ใช้ `OnPush`, signals และ track rows ด้วย database ID
- ใช้ Problem Details สำหรับข้อผิดพลาดของ API และแสดง error/loading/empty state ในหน้าเว็บ
- ใช้ native modal dialog เพื่อรองรับ Escape, focus management และการคืน focus เมื่อปิด
- กำหนด style budget ต่อ component ไว้ที่ warning 8 kB และ error 10 kB เพื่อรองรับ layout ที่ responsive พร้อมควบคุมไม่ให้ style โตเกินขอบเขต
- ทุกชื่อ package, namespace และ site identity ใช้ชื่อสมมติ `Example.Com.InterviewQuestion001` / `example.com`

## ผลการตรวจล่าสุด

- Backend: `dotnet test ... -c Release` ผ่าน 8 tests; failed 0, skipped 0
- Backend Release build: สำเร็จ; warnings 0, errors 0
- Frontend: `npm test -- --watch=false` ผ่าน 17 tests จาก 3 test files
- Angular production build: สำเร็จ; initial bundle 241.78 kB (estimated transfer 64.68 kB)
- Browser review: แสดง seed 9 รายการ, เปิดดูรายละเอียดแบบอ่านอย่างเดียว, เพิ่มรายการผ่าน API และแสดงต่อท้าย, และแสดงข้อผิดพลาดพร้อม retry ได้
- ยกเลิกฟอร์มและ keyboard/focus behavior มี automated tests ครอบคลุม; responsive breakpoints ตรวจจาก stylesheet ที่ 760px และ 520px
- ข้อมูลที่เพิ่มระหว่าง browser review ใช้ฐานข้อมูลทดลองในเครื่องและลบหลังตรวจแล้ว; ฐานข้อมูลปัจจุบันมี seed 9 รายการ
