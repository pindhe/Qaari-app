package org.somaliland.qaari.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.somaliland.qaari.BuildConfig
import java.net.URLEncoder
import java.util.concurrent.TimeUnit

object ApiClient {
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    private val client = OkHttpClient.Builder()
        .callTimeout(60, TimeUnit.SECONDS)
        .build()

    private val media = "application/json; charset=utf-8".toMediaType()

    suspend fun <T> get(path: String, token: String? = null, query: Map<String, String> = emptyMap(), decode: (String) -> T): T {
        return withContext(Dispatchers.IO) { request("GET", path, token, query, null, decode) }
    }

    suspend fun <T> post(path: String, token: String? = null, body: String = "{}", decode: (String) -> T): T {
        return withContext(Dispatchers.IO) { request("POST", path, token, emptyMap(), body, decode) }
    }

    suspend fun delete(path: String, token: String) {
        withContext(Dispatchers.IO) { request("DELETE", path, token, emptyMap(), null) { it } }
    }

    fun parse(body: String) = json

    private fun <T> request(
        method: String,
        path: String,
        token: String?,
        query: Map<String, String>,
        body: String?,
        decode: (String) -> T,
    ): T {
        val qs = if (query.isEmpty()) "" else query.entries.joinToString("&", prefix = "?") {
            "${it.key}=${URLEncoder.encode(it.value, "UTF-8")}"
        }
        val builder = Request.Builder()
            .url(apiBase + path + qs)
            .header("Accept", "application/json")
        if (token != null) builder.header("Authorization", "Bearer $token")
        when (method) {
            "POST" -> builder.post((body ?: "{}").toRequestBody(media))
            "DELETE" -> builder.delete()
            else -> builder.get()
        }
        client.newCall(builder.build()).execute().use { response ->
            val text = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                val message = runCatching {
                    json.parseToJsonElement(text).jsonObject["error"]?.jsonPrimitive?.content
                }.getOrNull() ?: "Something went wrong"
                throw ApiException(message)
            }
            if (text.isBlank()) return decode("{}")
            return decode(rewriteLocalHosts(text))
        }
    }

    private val apiBase: String
        get() {
            val configured = (if (isEmulator) BuildConfig.API_BASE_URL else BuildConfig.LAN_API_BASE_URL).trimEnd('/')
            return configured
        }

    private val isEmulator: Boolean
        get() {
            val fingerprint = android.os.Build.FINGERPRINT
            val model = android.os.Build.MODEL
            val hardware = android.os.Build.HARDWARE
            val product = android.os.Build.PRODUCT
            return fingerprint.startsWith("generic")
                || model.contains("Emulator", ignoreCase = true)
                || model.contains("Android SDK", ignoreCase = true)
                || hardware.contains("goldfish")
                || hardware.contains("ranchu")
                || product.contains("sdk", ignoreCase = true)
                || product.contains("emulator", ignoreCase = true)
        }

    private fun rewriteLocalHosts(text: String): String {
        val base = apiBase
        return text
            .replace("http://localhost:4000", base)
            .replace("http://127.0.0.1:4000", base)
            .replace("http://10.0.2.2:4000", base)
    }

    val format: Json get() = json
}
