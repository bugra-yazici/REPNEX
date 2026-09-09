using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IronTrackApi.Data;
using IronTrackApi.Models;

namespace IronTrackApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkoutsController : ControllerBase
{
    private readonly AppDbContext _context;

    public WorkoutsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/workouts/user/1
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserWorkouts(int userId)
    {
        var workouts = await _context.Workouts
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.WorkoutDate)
            .ThenByDescending(w => w.WorkoutId)
            .ToListAsync();

        return Ok(workouts);
    }

    // POST: api/workouts
    [HttpPost]
    public async Task<IActionResult> AddWorkout([FromBody] Workout workout)
    {
        workout.CreatedAt = DateTime.Now;
        _context.Workouts.Add(workout);
        await _context.SaveChangesAsync();

        return Ok(workout);
    }

    // DELETE: api/workouts/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWorkout(int id)
    {
        var workout = await _context.Workouts.FindAsync(id);
        if (workout == null)
        {
            return NotFound(new { message = "Kayıt bulunamadı!" });
        }

        _context.Workouts.Remove(workout);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Kayıt silindi." });
    }
    // GET: api/workouts/user/1/history/Incline%20Dumbbell%20Press
    [HttpGet("user/{userId}/history/{exerciseName}")]
    public async Task<IActionResult> GetExerciseHistory(int userId, string exerciseName)
    {
        // URL'den gelen Türkçe/özel karakterli hareket adını decode et
        var decodedName = Uri.UnescapeDataString(exerciseName).Trim().ToLower();

        var history = await _context.Workouts
            .Where(w => w.UserId == userId && w.ExerciseName.ToLower() == decodedName && w.Split != "Cardio")
            .OrderByDescending(w => w.WorkoutDate)
            .ToListAsync();

        if (!history.Any())
        {
            return Ok(new { lastWeight = 0, message = "Bu harekette geçmiş kayıt yok." });
        }

        // En son kullanılan ağırlığı bul
        var lastRecord = history.First();

        return Ok(new
        {
            lastWeight = lastRecord.Weight,
            lastReps = lastRecord.Reps,
            lastSets = lastRecord.Sets,
            workoutDate = lastRecord.WorkoutDate.ToString("yyyy-MM-dd")
        });
    }
}