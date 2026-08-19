package org.somaliland.qaari.ui

import android.app.Application
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Replay
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import coil.compose.AsyncImage
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.somaliland.qaari.QaariApplication
import org.somaliland.qaari.data.ApiClient
import org.somaliland.qaari.data.FavoriteItem
import org.somaliland.qaari.data.FavoritesResponse
import org.somaliland.qaari.data.QaariDetail
import org.somaliland.qaari.data.QaariDetailResponse
import org.somaliland.qaari.data.QaariListResponse
import org.somaliland.qaari.data.QaariSummary
import org.somaliland.qaari.data.RecordingPayload
import org.somaliland.qaari.data.RecordingResponse
import org.somaliland.qaari.data.SearchResponse
import org.somaliland.qaari.data.SessionStore
import org.somaliland.qaari.player.PlayerController

@Composable
fun QaariApp(vm: AppViewModel = viewModel()) {
    val session = vm.session
    val player = vm.player
    val showLogin by session.showLogin.collectAsState()
    val current by player.current.collectAsState()
    var tab by remember { mutableIntStateOf(0) }
    val nav = rememberNavController()

    LaunchedEffect(Unit) { session.restore() }
    LaunchedEffect(Unit) {
        while (true) {
            player.poll()
            delay(500)
        }
    }

    Scaffold(
        containerColor = Cream,
        bottomBar = {
            Column {
                if (current != null) PlayerBar(player)
                NavigationBar {
                    NavigationBarItem(tab == 0, { tab = 0; nav.navigate("home") { launchSingleTop = true } }, icon = { Icon(Icons.Default.Home, null) }, label = { Text("Home") })
                    NavigationBarItem(tab == 1, { tab = 1; nav.navigate("search") { launchSingleTop = true } }, icon = { Icon(Icons.Default.Search, null) }, label = { Text("Search") })
                    NavigationBarItem(tab == 2, { tab = 2; nav.navigate("favorites") { launchSingleTop = true } }, icon = { Icon(Icons.Default.Favorite, null) }, label = { Text("Favorites") })
                    NavigationBarItem(tab == 3, { tab = 3; nav.navigate("profile") { launchSingleTop = true } }, icon = { Icon(Icons.Default.Person, null) }, label = { Text("Account") })
                }
            }
        },
    ) { padding ->
        NavHost(nav, startDestination = "home", modifier = Modifier.padding(padding)) {
            composable("home") { HomeScreen(session) { nav.navigate("qaari/$it") } }
            composable("search") { SearchScreen(player) { nav.navigate("qaari/$it") } }
            composable("favorites") { FavoritesScreen(session, player) { nav.navigate("qaari/$it") } }
            composable("profile") { ProfileScreen(session) }
            composable("qaari/{id}", arguments = listOf(navArgument("id") { type = NavType.StringType })) {
                QaariScreen(it.arguments!!.getString("id")!!, session, player)
            }
        }
    }

    if (showLogin) {
        LoginSheet(session) { session.showLogin.value = false }
    }
}

class AppViewModel(app: Application) : androidx.lifecycle.AndroidViewModel(app) {
    val session: SessionStore = (app as QaariApplication).session
    val player = PlayerController(app)

    override fun onCleared() {
        player.release()
        super.onCleared()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun HomeScreen(session: SessionStore, open: (String) -> Unit) {
    val token by session.token.collectAsState()
    val user by session.user.collectAsState()
    var items by remember { mutableStateOf<List<QaariSummary>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(token) {
        loading = true
        runCatching {
            ApiClient.get("/qaaris", token) { ApiClient.format.decodeFromString<QaariListResponse>(it) }
        }.onSuccess { items = it.qaaris; error = null }
            .onFailure { error = it.message }
        loading = false
    }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Ministry of Information", color = GreenDark, fontWeight = FontWeight.SemiBold)
        Text("Listen to the Holy Quran", fontSize = 22.sp, fontWeight = FontWeight.Bold)
        if (user != null) Text("Streak: ${user!!.streakCount} days", color = Gold, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))
        if (loading) CircularProgressIndicator()
        error?.let { Text(it, color = Red) }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(items, key = { it.id }) { qaari ->
                Row(
                    Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(androidx.compose.ui.graphics.Color.White)
                        .clickable { open(qaari.id) }
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    AsyncImage(
                        model = qaari.photoUrl,
                        contentDescription = qaari.name,
                        modifier = Modifier.size(64.dp).clip(RoundedCornerShape(14.dp)).background(Green.copy(0.12f)),
                        contentScale = ContentScale.Crop,
                    )
                    Column(Modifier.padding(start = 12.dp)) {
                        Text(qaari.name, fontWeight = FontWeight.Bold)
                        Text("${qaari.uploadedJuzCount} Juz", color = androidx.compose.ui.graphics.Color.Gray)
                    }
                }
            }
        }
    }
}

@Composable
private fun QaariScreen(id: String, session: SessionStore, player: PlayerController) {
    val token by session.token.collectAsState()
    var detail by remember { mutableStateOf<QaariDetail?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(id, token) {
        runCatching {
            ApiClient.get("/qaaris/$id", token) { ApiClient.format.decodeFromString<QaariDetailResponse>(it) }
        }.onSuccess { detail = it.qaari }
    }

    val q = detail ?: return Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
    LazyColumn(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item {
            Text(q.name, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            Text(q.bio)
            Button(onClick = {
                if (token == null) session.requireLogin()
                else scope.launch {
                    ApiClient.post("/favorites", token, """{"qaariId":"$id"}""") { it }
                }
            }) { Text(if (q.isFavorite) "Favorited" else "Add favorite") }
        }
        items(q.juz) { juz ->
            Row(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(androidx.compose.ui.graphics.Color.White).padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text("Juz ${juz.juzNumber}", fontWeight = FontWeight.Bold)
                    Text(if (juz.available) "Ready" else "Not uploaded", color = androidx.compose.ui.graphics.Color.Gray)
                }
                if (juz.available) {
                    Icon(
                        Icons.Default.PlayArrow,
                        contentDescription = "Play",
                        modifier = Modifier.size(36.dp).clickable {
                            scope.launch {
                                val rec = ApiClient.get("/qaaris/$id/juz/${juz.juzNumber}") {
                                    ApiClient.format.decodeFromString<RecordingResponse>(it)
                                }
                                player.play(rec.recording)
                            }
                        },
                        tint = Green,
                    )
                }
            }
        }
    }
}

@Composable
private fun SearchScreen(player: PlayerController, open: (String) -> Unit) {
    var q by remember { mutableStateOf("") }
    var result by remember { mutableStateOf<SearchResponse?>(null) }
    LaunchedEffect(q) {
        if (q.isBlank()) {
            result = null
            return@LaunchedEffect
        }
        delay(250)
        result = runCatching {
            ApiClient.get("/search", query = mapOf("q" to q)) { ApiClient.format.decodeFromString<SearchResponse>(it) }
        }.getOrNull()
    }
    Column(Modifier.padding(16.dp)) {
        OutlinedTextField(q, { q = it }, label = { Text("Reciter name or Juz number") }, modifier = Modifier.fillMaxWidth())
        LazyColumn {
            result?.qaaris?.let { list ->
                items(list, key = { it.id }) { item ->
                    Text(item.name, Modifier.fillMaxWidth().clickable { open(item.id) }.padding(12.dp), fontWeight = FontWeight.Bold)
                }
            }
            result?.juzMatches?.let { list ->
                items(list, key = { it.recordingId }) { match ->
                    Text(
                        "Juz ${match.juzNumber} · ${match.qaariName}",
                        Modifier.fillMaxWidth().clickable {
                            player.play(
                                RecordingPayload(
                                    match.recordingId, match.qaariId, match.qaariName, match.photoUrl,
                                    match.juzNumber, match.audioUrl, match.durationSeconds,
                                ),
                            )
                        }.padding(12.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun FavoritesScreen(session: SessionStore, player: PlayerController, open: (String) -> Unit) {
    val token by session.token.collectAsState()
    var items by remember { mutableStateOf<List<FavoriteItem>>(emptyList()) }
    LaunchedEffect(token) {
        if (token == null) {
            items = emptyList()
            return@LaunchedEffect
        }
        items = runCatching {
            ApiClient.get("/favorites", token) { ApiClient.format.decodeFromString<FavoritesResponse>(it) }.favorites
        }.getOrDefault(emptyList())
    }
    if (token == null) {
        Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) {
            Text("Sign in to save favorites.")
            Button(onClick = { session.requireLogin() }) { Text("Sign in / Sign up") }
        }
        return
    }
    LazyColumn(Modifier.padding(16.dp)) {
        items(items, key = { it.id }) { item ->
            Row(Modifier.fillMaxWidth().clickable { open(item.qaariId) }.padding(12.dp)) {
                Column(Modifier.weight(1f)) {
                    Text(item.qaariName, fontWeight = FontWeight.Bold)
                    Text(item.juzNumber?.let { "Juz $it" } ?: "Qaari")
                }
                if (item.audioUrl != null && item.recordingId != null && item.juzNumber != null) {
                    Icon(Icons.Default.PlayArrow, null, Modifier.clickable {
                        player.play(
                            RecordingPayload(
                                item.recordingId, item.qaariId, item.qaariName, item.photoUrl,
                                item.juzNumber, item.audioUrl, item.durationSeconds,
                            ),
                        )
                    }, tint = Green)
                }
            }
        }
    }
}

@Composable
private fun ProfileScreen(session: SessionStore) {
    val user by session.user.collectAsState()
    val scope = rememberCoroutineScope()
    Column(Modifier.padding(24.dp)) {
        if (user == null) {
            Text("You are browsing as a guest.")
            Button(onClick = { session.requireLogin() }) { Text("Sign in / Sign up") }
        } else {
            Text(user!!.name, fontSize = 26.sp, fontWeight = FontWeight.Bold)
            Text(user!!.email ?: user!!.phone.orEmpty())
            Text("${user!!.streakCount}", fontSize = 40.sp, color = Gold, fontWeight = FontWeight.Bold)
            Text("day streak")
            TextButton(onClick = { scope.launch { session.logout() } }) { Text("Sign out", color = Red) }
        }
        Spacer(Modifier.height(24.dp))
        Text("Ministry of Information, Culture and National Guidance · Republic of Somaliland")
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun LoginSheet(session: SessionStore, onDismiss: () -> Unit) {
    var register by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var identifier by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(if (register) "Sign up" else "Sign in", fontSize = 22.sp, fontWeight = FontWeight.Bold)
            if (register) OutlinedTextField(name, { name = it }, label = { Text("Name") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(identifier, { identifier = it }, label = { Text("Email or phone") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(password, { password = it }, label = { Text("Password") }, modifier = Modifier.fillMaxWidth())
            error?.let { Text(it, color = Red) }
            Button(onClick = {
                scope.launch {
                    runCatching {
                        if (register) session.register(name, identifier, password) else session.login(identifier, password)
                    }.onFailure { error = it.message }
                }
            }, modifier = Modifier.fillMaxWidth()) { Text(if (register) "Sign up" else "Sign in") }
            TextButton(onClick = { register = !register }) {
                Text(if (register) "Already have an account? Sign in" else "No account? Sign up")
            }
        }
    }
}

@Composable
private fun PlayerBar(player: PlayerController) {
    val current by player.current.collectAsState()
    val playing by player.isPlaying.collectAsState()
    val position by player.position.collectAsState()
    val duration by player.duration.collectAsState()
    val rec = current ?: return
    Column(Modifier.fillMaxWidth().background(androidx.compose.ui.graphics.Color.White).padding(12.dp)) {
        Slider(
            value = if (duration == 0L) 0f else position / duration.toFloat(),
            onValueChange = { player.seek((it * duration).toLong()) },
        )
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Juz ${rec.juzNumber}", fontWeight = FontWeight.Bold)
                Text(rec.qaariName, fontSize = 12.sp)
            }
            Icon(Icons.Default.Replay, null, Modifier.clickable { player.skip(-15_000) }.padding(8.dp))
            Icon(
                if (playing) Icons.Default.Pause else Icons.Default.PlayArrow,
                null,
                Modifier.clickable { player.toggle() }.padding(8.dp),
                tint = Green,
            )
        }
    }
}
