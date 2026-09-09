namespace IronTrackApi.Models;

public class Workout
{
    public int WorkoutId { get; set; }
    public int UserId { get; set; }
    public DateTime WorkoutDate { get; set; }
    public string Split { get; set; } = string.Empty;
    public string MuscleGroup { get; set; } = string.Empty;
    public string Equipment { get; set; } = string.Empty;
    public string ExerciseName { get; set; } = string.Empty;
    public string SetType { get; set; } = string.Empty;
    public int Sets { get; set; }
    public int Reps { get; set; }
    public decimal Weight { get; set; }
    public decimal? Rpe { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}