using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ConstruX.API.DTOs;
using ConstruX.API.Services;

namespace ConstruX.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("signup")]
    public async Task<ActionResult<AuthResponseDto>> Signup(SignupDto dto)
    {
        if (string.IsNullOrEmpty(dto.Username) || string.IsNullOrEmpty(dto.Password))
        {
            return BadRequest("Username and Password are required.");
        }

        var result = await _authService.SignupAsync(dto);
        if (result == null)
        {
            return BadRequest("Username is already taken.");
        }

        return Ok(result);
    }

    [HttpPost("signin")]
    public async Task<ActionResult<AuthResponseDto>> Signin(SigninDto dto)
    {
        if (string.IsNullOrEmpty(dto.Username) || string.IsNullOrEmpty(dto.Password))
        {
            return BadRequest("Username and Password are required.");
        }

        var result = await _authService.SigninAsync(dto);
        if (result == null)
        {
            return Unauthorized("Invalid username or password.");
        }

        return Ok(result);
    }
}
