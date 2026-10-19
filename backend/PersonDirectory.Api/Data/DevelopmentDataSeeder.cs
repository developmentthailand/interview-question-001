using Example.Com.InterviewQuestion001.Entities;
using Microsoft.EntityFrameworkCore;

namespace Example.Com.InterviewQuestion001.Data;

public static class DevelopmentDataSeeder
{
    private static readonly SeedPerson[] SeedPeople =
    [
        new("กิตติ", "วัฒนกุล", new DateOnly(1988, 4, 12), "กรุงเทพมหานคร"),
        new("นภัสสร", "ใจดี", new DateOnly(1992, 9, 3), "นนทบุรี"),
        new("ธนกร", "แสงทอง", new DateOnly(1985, 1, 27), "ปทุมธานี"),
        new("ปวีณา", "สุขสม", new DateOnly(1995, 6, 18), "เชียงใหม่"),
        new("ภาณุ", "กิตติชัย", new DateOnly(1990, 11, 8), "ขอนแก่น"),
        new("อรทัย", "มีสุข", new DateOnly(1987, 3, 25), "ชลบุรี"),
        new("ณัฐวุฒิ", "บุญมี", new DateOnly(1998, 7, 14), "ภูเก็ต"),
        new("สุภาวดี", "พูนผล", new DateOnly(1991, 2, 6), "นครราชสีมา"),
        new("ศุภชัย", "รุ่งเรือง", new DateOnly(1983, 12, 30), "ระยอง")
    ];

    public static async Task SeedAsync(PersonDbContext database, CancellationToken cancellationToken = default)
    {
        if (await database.Persons.AnyAsync(cancellationToken))
        {
            return;
        }

        database.Persons.AddRange(SeedPeople.Select(person => new Person
        {
            FirstName = person.FirstName,
            LastName = person.LastName,
            DateOfBirth = person.DateOfBirth,
            Address = person.Address
        }));
        await database.SaveChangesAsync(cancellationToken);
    }

    private sealed record SeedPerson(string FirstName, string LastName, DateOnly DateOfBirth, string Address);
}
