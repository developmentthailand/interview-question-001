using System.ComponentModel.DataAnnotations;

namespace Example.Com.InterviewQuestion001.Contracts;

public sealed class CreatePersonRequest : IValidatableObject
{
    [Required]
    [StringLength(80)]
    public string FirstName { get; init; } = string.Empty;

    [Required]
    [StringLength(80)]
    public string LastName { get; init; } = string.Empty;

    [Required]
    public DateOnly? DateOfBirth { get; init; }

    [Required]
    [StringLength(300)]
    public string Address { get; init; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(FirstName))
        {
            yield return new ValidationResult("First name is required.", [nameof(FirstName)]);
        }

        if (string.IsNullOrWhiteSpace(LastName))
        {
            yield return new ValidationResult("Last name is required.", [nameof(LastName)]);
        }

        if (string.IsNullOrWhiteSpace(Address))
        {
            yield return new ValidationResult("Address is required.", [nameof(Address)]);
        }

        if (DateOfBirth is { } dateOfBirth && dateOfBirth > DateOnly.FromDateTime(DateTime.Now))
        {
            yield return new ValidationResult("Date of birth cannot be in the future.", [nameof(DateOfBirth)]);
        }
    }
}
