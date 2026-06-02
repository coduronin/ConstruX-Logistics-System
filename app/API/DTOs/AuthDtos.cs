namespace ConstruX.API.DTOs;

public class SignupDto
{
    public string Name { get; set; } = string.Empty;
    public string? TradeSpecialty { get; set; }
    public decimal? HourlyRate { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class SigninDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Message { get; set; } = string.Empty;
    public LaborDto User { get; set; } = null!;
    public string Token { get; set; } = string.Empty;
}
