using Example.Com.InterviewQuestion001.Entities;
using Microsoft.EntityFrameworkCore;

namespace Example.Com.InterviewQuestion001.Data;

public sealed class PersonDbContext(DbContextOptions<PersonDbContext> options) : DbContext(options)
{
    public DbSet<Person> Persons => Set<Person>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var person = modelBuilder.Entity<Person>();
        person.ToTable("Persons");
        person.HasKey(value => value.Id);
        person.Property(value => value.FirstName).HasMaxLength(80).IsRequired();
        person.Property(value => value.LastName).HasMaxLength(80).IsRequired();
        person.Property(value => value.DateOfBirth).IsRequired();
        person.Property(value => value.Address).HasMaxLength(300).IsRequired();
    }
}
