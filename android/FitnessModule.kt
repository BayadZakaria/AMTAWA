package com.example.healthtech.fitness

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.SelfImprovement
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.healthtech.profile.UserProfile
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlin.math.pow

// ==========================================
// 1. COUCHE DONNÉES (ROOM ENTITY UPDATE MOCK)
// ==========================================
// Mise à jour de l'entité ajoutant le champ fitness_goal
/*
@Entity(tableName = "user_profile")
data class UserProfile(
    @PrimaryKey val id: Int = 1,
    val firstName: String,
    val lastName: String,
    val age: Int,
    val weightKg: Float,
    val heightCm: Float,
    val fitnessGoal: String = "Maintien" // New field added
)
*/

enum class FitnessGoal(val label: String) {
    WEIGHT_LOSS("Perte de poids"),
    MUSCLE_GAIN("Prise de muscle"),
    MAINTENANCE("Maintien")
}

data class Exercise(
    val name: String,
    val durationMin: Int,
    val intensity: String,
    val icon: ImageVector
)

// ==========================================
// 2. COUCHE LOGIQUE (VIEWMODEL)
// ==========================================
class FitnessViewModel : ViewModel() {

    private val _selectedGoal = MutableStateFlow(FitnessGoal.MAINTENANCE)
    val selectedGoal = _selectedGoal.asStateFlow()

    private val _bmi = MutableStateFlow<Float?>(null)
    val bmi = _bmi.asStateFlow()

    private val _dailyExercises = MutableStateFlow<List<Exercise>>(emptyList())
    val dailyExercises = _dailyExercises.asStateFlow()

    fun loadUserData(weightKg: Float, heightCm: Float, conditions: List<String>) {
        // Calculate BMI
        if (weightKg > 0 && heightCm > 0) {
            val heightM = heightCm / 100f
            _bmi.value = weightKg / (heightM.pow(2))
        }

        generateMockPlan(conditions, _selectedGoal.value)
    }

    fun updateGoal(goal: FitnessGoal, conditions: List<String>) {
        _selectedGoal.value = goal
        generateMockPlan(conditions, goal)
    }

    private fun generateMockPlan(conditions: List<String>, goal: FitnessGoal) {
        val hasConstraint = conditions.any { 
            it.contains("Hypertension", true) || 
            it.contains("Diabète", true) ||
            it.contains("Asthme", true) 
        }

        val plan = mutableListOf<Exercise>()

        if (hasConstraint) {
            plan.add(Exercise("Marche Active (Échauffement)", 10, "Faible", Icons.Default.DirectionsRun))
            when (goal) {
                FitnessGoal.WEIGHT_LOSS -> {
                    plan.add(Exercise("Vélo elliptique", 20, "Modérée", Icons.Default.DirectionsRun))
                    plan.add(Exercise("Yoga et Étirements", 15, "Faible", Icons.Default.SelfImprovement))
                }
                FitnessGoal.MUSCLE_GAIN -> {
                    plan.add(Exercise("Renforcement au poids du corps (Assisté)", 15, "Modérée", Icons.Default.FitnessCenter))
                    plan.add(Exercise("Natation douce", 20, "Modérée", Icons.Default.DirectionsRun))
                }
                FitnessGoal.MAINTENANCE -> {
                    plan.add(Exercise("Pilates", 20, "Faible", Icons.Default.SelfImprovement))
                }
            }
        } else {
            plan.add(Exercise("Jogging (Échauffement)", 10, "Modérée", Icons.Default.DirectionsRun))
            when (goal) {
                FitnessGoal.WEIGHT_LOSS -> {
                    plan.add(Exercise("HIIT Cardio", 20, "Haute", Icons.Default.DirectionsRun))
                    plan.add(Exercise("Corde à sauter", 10, "Haute", Icons.Default.DirectionsRun))
                }
                FitnessGoal.MUSCLE_GAIN -> {
                    plan.add(Exercise("Haltérophilie / Musculation", 45, "Haute", Icons.Default.FitnessCenter))
                    plan.add(Exercise("Gainage", 10, "Modérée", Icons.Default.SelfImprovement))
                }
                FitnessGoal.MAINTENANCE -> {
                    plan.add(Exercise("Course à pied", 30, "Modérée", Icons.Default.DirectionsRun))
                    plan.add(Exercise("Stretching complet", 15, "Faible", Icons.Default.SelfImprovement))
                }
            }
        }
        _dailyExercises.value = plan
    }
}

// ==========================================
// 3. COUCHE INTERFACE (JETPACK COMPOSE & M3)
// ==========================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FitnessScreen(
    currentGoal: FitnessGoal,
    bmi: Float?,
    exercises: List<Exercise>,
    onGoalChanged: (FitnessGoal) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Programme Sportif") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            
            if (bmi != null) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Votre Indice de Masse Corporelle (IMC)", style = MaterialTheme.typography.labelMedium)
                        Text(
                            text = String.format("%.1f", bmi),
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                    }
                }
            }

            Text("Objectif Actuel", style = MaterialTheme.typography.titleMedium)
            
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FitnessGoal.values().forEach { goal ->
                    FilterChip(
                        selected = currentGoal == goal,
                        onClick = { onGoalChanged(goal) },
                        label = { Text(goal.label) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primary,
                            selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                        )
                    )
                }
            }

            Text("Exercices du jour", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 8.dp))

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(exercises) { exercise ->
                    ExerciseCard(exercise = exercise)
                }
            }
        }
    }
}

@Composable
fun ExerciseCard(exercise: Exercise) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = exercise.icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(40.dp)
            )
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(text = exercise.name, style = MaterialTheme.typography.titleMedium)
                Text(
                    text = "Durée : ${exercise.durationMin} min",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                )
            }
            Surface(
                color = when (exercise.intensity) {
                    "Faible" -> MaterialTheme.colorScheme.tertiaryContainer
                    "Modérée" -> MaterialTheme.colorScheme.secondaryContainer
                    else -> MaterialTheme.colorScheme.errorContainer
                },
                shape = MaterialTheme.shapes.small
            ) {
                Text(
                    text = exercise.intensity,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = when (exercise.intensity) {
                        "Faible" -> MaterialTheme.colorScheme.onTertiaryContainer
                        "Modérée" -> MaterialTheme.colorScheme.onSecondaryContainer
                        else -> MaterialTheme.colorScheme.onErrorContainer
                    }
                )
            }
        }
    }
}

// ==========================================
// 4. PREVIEW
// ==========================================
@Preview(showBackground = true)
@Composable
fun FitnessScreenPreview() {
    MaterialTheme {
        FitnessScreen(
            currentGoal = FitnessGoal.WEIGHT_LOSS,
            bmi = 24.5f,
            exercises = listOf(
                Exercise("Jogging", 20, "Modérée", Icons.Default.DirectionsRun),
                Exercise("HIIT", 15, "Haute", Icons.Default.FitnessCenter),
                Exercise("Yoga", 10, "Faible", Icons.Default.SelfImprovement)
            ),
            onGoalChanged = {}
        )
    }
}
