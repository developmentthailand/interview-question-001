namespace Example.Com.InterviewQuestion001.Entities;

public sealed class Person
{
    public int Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public DateOnly DateOfBirth { get; set; }

    public string Address { get; set; } = string.Empty;
}
