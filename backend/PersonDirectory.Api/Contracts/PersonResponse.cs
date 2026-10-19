namespace Example.Com.InterviewQuestion001.Contracts;

public sealed record PersonResponse(
    int Id,
    string FirstName,
    string LastName,
    DateOnly DateOfBirth,
    string Address);
