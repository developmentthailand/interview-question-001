using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Example.Com.InterviewQuestion001.Contracts;
using Example.Com.InterviewQuestion001.Data;
using Example.Com.InterviewQuestion001.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace PersonDirectory.Api.Tests;

public sealed class PersonsApiTests
{
    [Fact]
    public async Task GetPersons_ReturnsEmptyCollection()
    {
        using var factory = new PersonDirectoryFactory();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/persons");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var people = await response.Content.ReadFromJsonAsync<PersonResponse[]>();
        Assert.NotNull(people);
        Assert.Empty(people);
    }

    [Fact]
    public async Task GetPersons_ReturnsRecordsOrderedById()
    {
        using var factory = new PersonDirectoryFactory();
        await SeedAsync(factory,
            NewPerson(17, "Mali", "Sukjai"),
            NewPerson(4, "Narin", "Dee"));
        using var client = factory.CreateClient();

        var people = await client.GetFromJsonAsync<PersonResponse[]>("/api/persons");

        Assert.NotNull(people);
        Assert.Equal([4, 17], people.Select(person => person.Id));
    }

    [Fact]
    public async Task GetPerson_ReturnsRequestedRecord()
    {
        using var factory = new PersonDirectoryFactory();
        await SeedAsync(factory, NewPerson(42, "Mali", "Sukjai"));
        using var client = factory.CreateClient();

        var person = await client.GetFromJsonAsync<PersonResponse>("/api/persons/42");

        Assert.NotNull(person);
        Assert.Equal(42, person.Id);
        Assert.Equal("Mali", person.FirstName);
        Assert.Equal(new DateOnly(1988, 4, 12), person.DateOfBirth);
    }

    [Fact]
    public async Task GetPerson_ReturnsProblemDetailsForUnknownId()
    {
        using var factory = new PersonDirectoryFactory();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/persons/404");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(404, problem.Status);
    }

    [Fact]
    public async Task PostPerson_CreatesAndReturns201()
    {
        using var factory = new PersonDirectoryFactory();
        using var client = factory.CreateClient();
        var request = new CreatePersonRequest
        {
            FirstName = "  Mali ",
            LastName = " Sukjai  ",
            DateOfBirth = new DateOnly(1988, 4, 12),
            Address = "  Bangkok  "
        };

        using var response = await client.PostAsJsonAsync("/api/persons", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        var person = await response.Content.ReadFromJsonAsync<PersonResponse>();
        Assert.NotNull(person);
        Assert.True(person.Id > 0);
        Assert.Equal("Mali", person.FirstName);
        Assert.Equal("Sukjai", person.LastName);
        Assert.Equal(new DateOnly(1988, 4, 12), person.DateOfBirth);
        Assert.Equal("Bangkok", person.Address);
    }

    [Fact]
    public async Task PostPerson_RejectsMissingAndBlankFields()
    {
        using var factory = new PersonDirectoryFactory();
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync("/api/persons", new
        {
            firstName = " ",
            lastName = "",
            dateOfBirth = (DateOnly?)null,
            address = ""
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var errors = problem.RootElement.GetProperty("errors");
        Assert.Contains("FirstName", errors.EnumerateObject().Select(error => error.Name));
        Assert.Contains("LastName", errors.EnumerateObject().Select(error => error.Name));
        Assert.Contains("DateOfBirth", errors.EnumerateObject().Select(error => error.Name));
        Assert.Contains("Address", errors.EnumerateObject().Select(error => error.Name));
    }

    [Fact]
    public async Task PostPerson_RejectsFutureBirthDate()
    {
        using var factory = new PersonDirectoryFactory();
        using var client = factory.CreateClient();
        var request = new CreatePersonRequest
        {
            FirstName = "Mali",
            LastName = "Sukjai",
            DateOfBirth = new DateOnly(9999, 12, 31),
            Address = "Bangkok"
        };

        using var response = await client.PostAsJsonAsync("/api/persons", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task PostPerson_AcceptsBirthDateTodayInLocalTime()
    {
        using var factory = new PersonDirectoryFactory();
        using var client = factory.CreateClient();
        var request = new CreatePersonRequest
        {
            FirstName = "Mali",
            LastName = "Sukjai",
            DateOfBirth = DateOnly.FromDateTime(DateTime.Now),
            Address = "Bangkok"
        };

        using var response = await client.PostAsJsonAsync("/api/persons", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    private static async Task SeedAsync(PersonDirectoryFactory factory, params Person[] people)
    {
        using var client = factory.CreateClient();
        await using var scope = factory.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<PersonDbContext>();
        await database.Persons.AddRangeAsync(people);
        await database.SaveChangesAsync();
    }

    private static Person NewPerson(int id, string firstName, string lastName) => new()
    {
        Id = id,
        FirstName = firstName,
        LastName = lastName,
        DateOfBirth = new DateOnly(1988, 4, 12),
        Address = "Bangkok"
    };
}
