package com.example.healthtech.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.room.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

// ==========================================
// 1. COUCHE DONNÉES (ROOM ENTITY & DAO)
// ==========================================

@Entity(tableName = "user_profile")
data class UserProfile(
    @PrimaryKey val id: Int = 1, // Profil unique par appareil
    val firstName: String,
    val lastName: String,
    val age: Int,
    val weightKg: Float,
    val heightCm: Float
)

@Dao
interface UserProfileDao {
    @Query("SELECT * FROM user_profile WHERE id = 1")
    fun getUserProfile(): Flow<UserProfile?>

    @Upsert
    suspend fun upsertProfile(profile: UserProfile)
}

// ==========================================
// 2. COUCHE LOGIQUE (VIEWMODEL)
// ==========================================

class ProfileViewModel(private val dao: UserProfileDao) : ViewModel() {

    // L'état interne de l'UI
    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        // Collecter les données de Room en temps réel
        viewModelScope.launch {
            dao.getUserProfile().collect { profile ->
                if (profile != null) {
                    _uiState.update { currentState ->
                        currentState.copy(
                            firstName = profile.firstName,
                            lastName = profile.lastName,
                            age = profile.age.toString(),
                            weightKg = profile.weightKg.toString(),
                            heightCm = profile.heightCm.toString(),
                            isInitialized = true
                        )
                    }
                } else {
                    _uiState.update { it.copy(isInitialized = true) }
                }
            }
        }
    }

    // Handlers pour modifier les champs de texte
    fun onFirstNameChange(name: String) = _uiState.update { it.copy(firstName = name) }
    fun onLastNameChange(name: String) = _uiState.update { it.copy(lastName = name) }
    fun onAgeChange(age: String) = _uiState.update { it.copy(age = age) }
    fun onWeightChange(weight: String) = _uiState.update { it.copy(weightKg = weight) }
    fun onHeightChange(height: String) = _uiState.update { it.copy(heightCm = height) }
    
    // Basculer entre Lecture et Édition
    fun toggleEditMode() = _uiState.update { it.copy(isEditing = !it.isEditing) }

    // Sauvegarder dans la DB locale
    fun saveProfile() {
        val currentState = _uiState.value
        val ageInt = currentState.age.toIntOrNull() ?: 0
        val weightFloat = currentState.weightKg.toFloatOrNull() ?: 0f
        val heightFloat = currentState.heightCm.toFloatOrNull() ?: 0f

        val profile = UserProfile(
            firstName = currentState.firstName,
            lastName = currentState.lastName,
            age = ageInt,
            weightKg = weightFloat,
            heightCm = heightFloat
        )

        viewModelScope.launch {
            dao.upsertProfile(profile)
            // Sortir du mode édition après sauvegarde
            _uiState.update { it.copy(isEditing = false) }
        }
    }
}

// Data class qui représente ce qui est affiché à l'écran
data class ProfileUiState(
    val firstName: String = "",
    val lastName: String = "",
    val age: String = "",
    val weightKg: String = "",
    val heightCm: String = "",
    val isEditing: Boolean = false,
    val isInitialized: Boolean = false
)

// ==========================================
// 3. COUCHE INTERFACE (JETPACK COMPOSE & M3)
// ==========================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    uiState: ProfileUiState,
    onFirstNameChange: (String) -> Unit,
    onLastNameChange: (String) -> Unit,
    onAgeChange: (String) -> Unit,
    onWeightChange: (String) -> Unit,
    onHeightChange: (String) -> Unit,
    onToggleEdit: () -> Unit,
    onSave: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mon Profil") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { if (uiState.isEditing) onSave() else onToggleEdit() },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            ) {
                if (uiState.isEditing) {
                    Icon(Icons.Default.Save, contentDescription = "Enregistrer")
                } else {
                    Icon(Icons.Default.Edit, contentDescription = "Modifier")
                }
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            
            ProfileCard(
                title = "Informations Personnelles",
                isEditing = uiState.isEditing
            ) {
                ProfileField(
                    label = "Prénom",
                    value = uiState.firstName,
                    onValueChange = onFirstNameChange,
                    isEditing = uiState.isEditing
                )
                ProfileField(
                    label = "Nom",
                    value = uiState.lastName,
                    onValueChange = onLastNameChange,
                    isEditing = uiState.isEditing
                )
            }

            ProfileCard(
                title = "Biométrie",
                isEditing = uiState.isEditing
            ) {
                ProfileField(
                    label = "Âge (ans)",
                    value = uiState.age,
                    onValueChange = onAgeChange,
                    isEditing = uiState.isEditing,
                    keyboardType = KeyboardType.Number
                )
                ProfileField(
                    label = "Poids (kg)",
                    value = uiState.weightKg,
                    onValueChange = onWeightChange,
                    isEditing = uiState.isEditing,
                    keyboardType = KeyboardType.Decimal
                )
                ProfileField(
                    label = "Taille (cm)",
                    value = uiState.heightCm,
                    onValueChange = onHeightChange,
                    isEditing = uiState.isEditing,
                    keyboardType = KeyboardType.Decimal
                )
            }
        }
    }
}

@Composable
fun ProfileCard(
    title: String,
    isEditing: Boolean,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = if (isEditing) 4.dp else 1.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary
            )
            HorizontalDivider()
            content()
        }
    }
}

@Composable
fun ProfileField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    isEditing: Boolean,
    keyboardType: KeyboardType = KeyboardType.Text
) {
    if (isEditing) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = { Text(label) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = MaterialTheme.colorScheme.surface,
                unfocusedContainerColor = MaterialTheme.colorScheme.surface
            )
        )
    } else {
        Column(modifier = Modifier.padding(vertical = 4.dp)) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
            )
            Text(
                text = value.ifEmpty { "Non spécifié" },
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

// ==========================================
// 4. PREVIEW (MODE TEST AVEC DONNÉES FACTICES)
// ==========================================

@Preview(showBackground = true, name = "Mode Lecture")
@Composable
fun ProfileScreenPreview_ReadOnly() {
    MaterialTheme {
        ProfileScreen(
            uiState = ProfileUiState(
                firstName = "Zakaria",
                lastName = "Bayad",
                age = "32",
                weightKg = "80",
                heightCm = "178",
                isEditing = false
            ),
            onFirstNameChange = {},
            onLastNameChange = {},
            onAgeChange = {},
            onWeightChange = {},
            onHeightChange = {},
            onToggleEdit = {},
            onSave = {}
        )
    }
}

@Preview(showBackground = true, name = "Mode Édition")
@Composable
fun ProfileScreenPreview_EditMode() {
    MaterialTheme {
        ProfileScreen(
            uiState = ProfileUiState(
                firstName = "Zakaria",
                lastName = "Bayad",
                age = "32",
                weightKg = "80",
                heightCm = "178",
                isEditing = true
            ),
            onFirstNameChange = {},
            onLastNameChange = {},
            onAgeChange = {},
            onWeightChange = {},
            onHeightChange = {},
            onToggleEdit = {},
            onSave = {}
        )
    }
}
