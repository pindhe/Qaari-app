package org.somaliland.qaari.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

private val Context.dataStore by preferencesDataStore("qaari_session")

class SessionStore(private val context: Context) {
    private val tokenKey = stringPreferencesKey("token")
    private val userKey = stringPreferencesKey("user")

    private val _user = MutableStateFlow<UserProfile?>(null)
    val user: StateFlow<UserProfile?> = _user
    private val _token = MutableStateFlow<String?>(null)
    val token: StateFlow<String?> = _token
    val showLogin = MutableStateFlow(false)

    suspend fun restore() {
        val prefs = context.dataStore.data.first()
        _token.value = prefs[tokenKey]
        prefs[userKey]?.let { _user.value = ApiClient.format.decodeFromString(it) }
        _token.value?.let { ping() }
    }

    fun requireLogin() {
        showLogin.value = true
    }

    suspend fun login(identifier: String, password: String) {
        val body = buildJsonObject {
            put("identifier", identifier)
            put("password", password)
        }.toString()
        val res = ApiClient.post("/auth/login", body = body) {
            ApiClient.format.decodeFromString<AuthResponse>(it)
        }
        persist(res)
    }

    suspend fun register(name: String, identifier: String, password: String) {
        val body = buildJsonObject {
            put("name", name)
            put("password", password)
            if (identifier.contains("@")) put("email", identifier) else put("phone", identifier)
        }.toString()
        val res = ApiClient.post("/auth/register", body = body) {
            ApiClient.format.decodeFromString<AuthResponse>(it)
        }
        persist(res)
    }

    suspend fun logout() {
        context.dataStore.edit { it.clear() }
        _token.value = null
        _user.value = null
    }

    suspend fun ping() {
        val token = _token.value ?: return
        runCatching {
            val res = ApiClient.post("/auth/app-open", token) {
                ApiClient.format.decodeFromString<UserEnvelope>(it)
            }
            _user.value = res.user
            context.dataStore.edit { prefs ->
                prefs[userKey] = ApiClient.format.encodeToString(res.user)
            }
        }
    }

    private suspend fun persist(res: AuthResponse) {
        _token.value = res.token
        _user.value = res.user
        showLogin.value = false
        context.dataStore.edit {
            it[tokenKey] = res.token
            it[userKey] = ApiClient.format.encodeToString(res.user)
        }
    }
}
