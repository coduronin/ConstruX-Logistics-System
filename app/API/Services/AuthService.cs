using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ConstruX.API.Data;
using ConstruX.API.DTOs;
using ConstruX.API.Models;

namespace ConstruX.API.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> SignupAsync(SignupDto dto);
    Task<AuthResponseDto?> SigninAsync(SigninDto dto);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;

    public AuthService(AppDbContext context)
    {
        _context = context;
    }

    private string GenerateJwtToken(Labor labor)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes("SuperSecretKeyForConstruXLogisticsSystem123!");
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, labor.WorkerId.ToString()),
                new Claim(ClaimTypes.Name, labor.Username ?? labor.Name),
                new Claim(ClaimTypes.Role, labor.IsAdmin ? "Admin" : "Worker")
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public async Task<AuthResponseDto?> SignupAsync(SignupDto dto)
    {
        // Check if username is already taken
        var existing = await _context.Labor.FirstOrDefaultAsync(l => l.Username == dto.Username);
        if (existing != null)
        {
            return null; // Username taken
        }

        var labor = new Labor
        {
            Name = dto.Name,
            TradeSpecialty = dto.TradeSpecialty,
            HourlyRate = dto.HourlyRate,
            Username = dto.Username,
            Password = dto.Password,
            IsAdmin = false
        };

        _context.Labor.Add(labor);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            Message = "User registered successfully",
            User = new LaborDto
            {
                WorkerId = labor.WorkerId,
                Name = labor.Name,
                TradeSpecialty = labor.TradeSpecialty,
                HourlyRate = labor.HourlyRate,
                Username = labor.Username,
                IsAdmin = labor.IsAdmin
            },
            Token = GenerateJwtToken(labor)
        };
    }

    public async Task<AuthResponseDto?> SigninAsync(SigninDto dto)
    {
        var labor = await _context.Labor.FirstOrDefaultAsync(l => l.Username == dto.Username);
        if (labor == null || labor.Password != dto.Password)
        {
            return null; // Invalid credentials
        }

        return new AuthResponseDto
        {
            Message = "Authentication successful",
            User = new LaborDto
            {
                WorkerId = labor.WorkerId,
                Name = labor.Name,
                TradeSpecialty = labor.TradeSpecialty,
                HourlyRate = labor.HourlyRate,
                Username = labor.Username,
                IsAdmin = labor.IsAdmin
            },
            Token = GenerateJwtToken(labor)
        };
    }
}
