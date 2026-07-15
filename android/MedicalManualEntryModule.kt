package com.example.healthtech.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

// ==========================================
// 1. COUCHE LOGIQUE (VIEWMODEL)
// ==========================================

class MedicalManualViewModel : ViewModel() {
    private val _conditions = MutableStateFlow<List<String>>(emptyList())
    val conditions: StateFlow<List<String>> = _conditions.asStateFlow()

    private val _allergies = MutableStateFlow<List<String>>(emptyList())
    val allergies: StateFlow<List<String>> = _allergies.asStateFlow()

    fun toggleCondition(condition: String) {
        val current = _conditions.value.toMutableList()
        if (current.contains(condition)) {
            current.remove(condition)
        } else {
            current.add(condition)
        }
        _conditions.value = current
    }

    fun toggleAllergy(allergy: String) {
        val current = _allergies.value.toMutableList()
        if (current.contains(allergy)) {
            current.remove(allergy)
        } else {
            current.add(allergy)
        }
        _allergies.value = current
    }

    fun saveMedicalProfile() {
        val finalConditions = _conditions.value
        val finalAllergies = _allergies.value
        
        // La sortie finale est formatée exactement comme le ferait l'IA (List<String>).
        // Cela peut être injecté dans une méthode @Upsert de Room, ex:
        // dao.upsertProfile(currentProfile.copy(conditions = finalConditions, allergies = finalAllergies))
    }
}

// ==========================================
// 2. COUCHE INTERFACE (JETPACK COMPOSE & M3)
// ==========================================

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun MedicalProfileManualEntryScreen(
    conditions: List<String>,
    allergies: List<String>,
    onToggleCondition: (String) -> Unit,
    onToggleAllergy: (String) -> Unit,
    onSaveProfile: () -> Unit
) {
    val commonConditions = listOf("Diabète de type 2", "Hypertension", "Cholestérol", "Asthme")
    val commonAllergies = listOf("Arachides", "Lactose", "Gluten", "Fruits de mer")

    var customCondition by remember { mutableStateOf("") }
    var customAllergy by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Saisie Médicale") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        },
        bottomBar = {
            Box(modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth()) {
                Button(
                    onClick = onSaveProfile,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text("Enregistrer le profil médical", modifier = Modifier.padding(8.dp))
                }
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // SECTION: Conditions Médicales
            item {
                Text(
                    text = "Conditions Médicales",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Combine conditions communes avec celles déjà tapées par l'utilisateur (custom)
                    val allConditionsToDisplay = (commonConditions + conditions).distinct()
                    
                    allConditionsToDisplay.forEach { condition ->
                        val isSelected = conditions.contains(condition)
                        FilterChip(
                            selected = isSelected,
                            onClick = { onToggleCondition(condition) },
                            label = { Text(condition) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                                selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = customCondition,
                    onValueChange = { customCondition = it },
                    label = { Text("Ajouter une autre maladie") },
                    modifier = Modifier.fillMaxWidth(),
                    trailingIcon = {
                        IconButton(
                            onClick = {
                                if (customCondition.isNotBlank()) {
                                    onToggleCondition(customCondition.trim())
                                    customCondition = ""
                                }
                            }
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Ajouter maladie")
                        }
                    },
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(
                        onDone = {
                            if (customCondition.isNotBlank()) {
                                onToggleCondition(customCondition.trim())
                                customCondition = ""
                            }
                        }
                    ),
                    singleLine = true
                )
            }

            // SECTION: Allergies & Intolérances
            item {
                Text(
                    text = "Allergies & Intolérances",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val allAllergiesToDisplay = (commonAllergies + allergies).distinct()
                    
                    allAllergiesToDisplay.forEach { allergy ->
                        val isSelected = allergies.contains(allergy)
                        FilterChip(
                            selected = isSelected,
                            onClick = { onToggleAllergy(allergy) },
                            label = { Text(allergy) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = MaterialTheme.colorScheme.errorContainer,
                                selectedLabelColor = MaterialTheme.colorScheme.onErrorContainer
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = customAllergy,
                    onValueChange = { customAllergy = it },
                    label = { Text("Ajouter une autre allergie") },
                    modifier = Modifier.fillMaxWidth(),
                    trailingIcon = {
                        IconButton(
                            onClick = {
                                if (customAllergy.isNotBlank()) {
                                    onToggleAllergy(customAllergy.trim())
                                    customAllergy = ""
                                }
                            }
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Ajouter allergie")
                        }
                    },
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(
                        onDone = {
                            if (customAllergy.isNotBlank()) {
                                onToggleAllergy(customAllergy.trim())
                                customAllergy = ""
                            }
                        }
                    ),
                    singleLine = true
                )
            }
        }
    }
}

// ==========================================
// 3. PREVIEW DUMMY DATA FOR COMPOSE
// ==========================================

@Preview(showBackground = true)
@Composable
fun MedicalProfileManualEntryScreenPreview() {
    MaterialTheme {
        MedicalProfileManualEntryScreen(
            conditions = listOf("Diabète de type 2", "Thyroïde"),
            allergies = listOf("Arachides", "Gluten"),
            onToggleCondition = {},
            onToggleAllergy = {},
            onSaveProfile = {}
        )
    }
}
