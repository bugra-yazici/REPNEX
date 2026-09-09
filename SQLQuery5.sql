-- 1. Kullanıcılar Tablosu
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 2. Antrenman Kayıtları Tablosu
CREATE TABLE Workouts (
    WorkoutId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    WorkoutDate DATE NOT NULL,
    Split NVARCHAR(50) NOT NULL,
    MuscleGroup NVARCHAR(50) NOT NULL,
    Equipment NVARCHAR(50) NOT NULL,
    ExerciseName NVARCHAR(100) NOT NULL,
    SetType NVARCHAR(30) NOT NULL,
    Sets INT NOT NULL,
    Reps INT NOT NULL,
    Weight DECIMAL(6,2) NOT NULL,
    RPE DECIMAL(3,1) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Workouts_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
);