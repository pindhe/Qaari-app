package org.somaliland.qaari.data

import kotlinx.serialization.Serializable

@Serializable
data class UserProfile(
    val id: String,
    val name: String,
    val email: String? = null,
    val phone: String? = null,
    val role: String,
    val streakCount: Int = 0,
    val lastLoginDate: String? = null,
)

@Serializable
data class AuthResponse(val token: String, val user: UserProfile)

@Serializable
data class UserEnvelope(val user: UserProfile)

@Serializable
data class QaariSummary(
    val id: String,
    val name: String,
    val bio: String,
    val photoUrl: String? = null,
    val uploadedJuzCount: Int = 0,
    val isFavorite: Boolean? = false,
)

@Serializable
data class QaariListResponse(val qaaris: List<QaariSummary>)

@Serializable
data class JuzItem(
    val juzNumber: Int,
    val recordingId: String? = null,
    val durationSeconds: Int? = null,
    val audioUrl: String? = null,
    val available: Boolean = false,
)

@Serializable
data class QaariDetail(
    val id: String,
    val name: String,
    val bio: String,
    val photoUrl: String? = null,
    val uploadedJuzCount: Int = 0,
    val isFavorite: Boolean = false,
    val juz: List<JuzItem> = emptyList(),
)

@Serializable
data class QaariDetailResponse(val qaari: QaariDetail)

@Serializable
data class RecordingPayload(
    val id: String,
    val qaariId: String,
    val qaariName: String,
    val qaariPhotoUrl: String? = null,
    val juzNumber: Int,
    val audioUrl: String,
    val durationSeconds: Int? = null,
)

@Serializable
data class RecordingResponse(val recording: RecordingPayload)

@Serializable
data class FavoriteItem(
    val id: String,
    val qaariId: String,
    val qaariName: String,
    val photoUrl: String? = null,
    val juzNumber: Int? = null,
    val recordingId: String? = null,
    val durationSeconds: Int? = null,
    val audioUrl: String? = null,
)

@Serializable
data class FavoritesResponse(val favorites: List<FavoriteItem>)

@Serializable
data class JuzMatch(
    val qaariId: String,
    val qaariName: String,
    val photoUrl: String? = null,
    val juzNumber: Int,
    val recordingId: String,
    val durationSeconds: Int? = null,
    val audioUrl: String,
)

@Serializable
data class SearchResponse(
    val qaaris: List<QaariSummary> = emptyList(),
    val juzMatches: List<JuzMatch> = emptyList(),
)

class ApiException(message: String) : Exception(message)
