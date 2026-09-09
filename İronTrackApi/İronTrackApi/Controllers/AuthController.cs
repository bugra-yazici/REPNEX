using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IronTrackApi.Data;
using IronTrackApi.Models;

namespace IronTrackApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
        _context = context;
    }

    // POST: api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] User user)
    {
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == user.Email.ToLower()))
        {
            return BadRequest(new { message = "Bu e-posta adresiyle zaten bir hesap var!" });
        }

        user.CreatedAt = DateTime.Now;
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Kayıt başarılı!", userId = user.UserId, fullName = user.FullName, email = user.Email });
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u =>
            u.Email.ToLower() == loginDto.Email.ToLower() && u.Password == loginDto.Password);

        if (user == null)
        {
            return Unauthorized(new { message = "Geçersiz e-posta veya şifre!" });
        }

        return Ok(new { message = "Giriş başarılı!", userId = user.UserId, fullName = user.FullName, email = user.Email });
    }

    // GET: api/auth/profile/1 (Profili SQL'den getirir)
    [HttpGet("profile/{userId}")]
    public async Task<IActionResult> GetProfile(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "Kullanıcı bulunamadı!" });
        }

        return Ok(user);
    }

    // PUT: api/auth/profile/1 (Profili SQL'e kaydeder/günceller)
    [HttpPut("profile/{userId}")]
    public async Task<IActionResult> UpdateProfile(int userId, [FromBody] ProfileUpdateDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "Kullanıcı bulunamadı!" });
        }

        user.FullName = dto.FullName;
        user.Phone = dto.Phone;
        user.Age = dto.Age;
        user.Height = dto.Height;
        user.Weight = dto.Weight;
        user.Goal = dto.Goal;

        await _context.SaveChangesAsync();
        return Ok(user);
    }
}

public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class ProfileUpdateDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public int? Age { get; set; }
    public decimal? Height { get; set; }
    public decimal? Weight { get; set; }
    public string? Goal { get; set; }
}