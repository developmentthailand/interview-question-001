using Example.Com.InterviewQuestion001.Contracts;
using Example.Com.InterviewQuestion001.Data;
using Example.Com.InterviewQuestion001.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Example.Com.InterviewQuestion001.Controllers;

[ApiController]
[Route("api/persons")]
public sealed class PersonsController(PersonDbContext database) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PersonResponse[]>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PersonResponse>>> GetPersons(
        CancellationToken cancellationToken)
    {
        var people = await database.Persons
            .AsNoTracking()
            .OrderBy(person => person.Id)
            .Select(person => new PersonResponse(
                person.Id,
                person.FirstName,
                person.LastName,
                person.DateOfBirth,
                person.Address))
            .ToListAsync(cancellationToken);

        return Ok(people);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType<PersonResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PersonResponse>> GetPerson(
        int id,
        CancellationToken cancellationToken)
    {
        var person = await database.Persons
            .AsNoTracking()
            .Where(value => value.Id == id)
            .Select(value => new PersonResponse(
                value.Id,
                value.FirstName,
                value.LastName,
                value.DateOfBirth,
                value.Address))
            .FirstOrDefaultAsync(cancellationToken);

        if (person is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Person not found",
                Detail = $"No person with ID {id} exists.",
                Instance = HttpContext.Request.Path
            });
        }

        return Ok(person);
    }

    [HttpPost]
    [ProducesResponseType<PersonResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PersonResponse>> CreatePerson(
        CreatePersonRequest request,
        CancellationToken cancellationToken)
    {
        var person = new Person
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            DateOfBirth = request.DateOfBirth!.Value,
            Address = request.Address.Trim()
        };

        database.Persons.Add(person);
        await database.SaveChangesAsync(cancellationToken);

        var response = new PersonResponse(
            person.Id,
            person.FirstName,
            person.LastName,
            person.DateOfBirth,
            person.Address);

        return CreatedAtAction(nameof(GetPerson), new { id = person.Id }, response);
    }
}
