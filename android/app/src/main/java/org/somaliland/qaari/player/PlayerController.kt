package org.somaliland.qaari.player

import android.content.ComponentName
import android.content.Context
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.MoreExecutors
import kotlinx.coroutines.flow.MutableStateFlow
import org.somaliland.qaari.data.RecordingPayload

class PlayerController(context: Context) {
    val current = MutableStateFlow<RecordingPayload?>(null)
    val isPlaying = MutableStateFlow(false)
    val position = MutableStateFlow(0L)
    val duration = MutableStateFlow(0L)

    private var controller: MediaController? = null
    private val future: ListenableFuture<MediaController> = MediaController.Builder(
        context,
        SessionToken(context, ComponentName(context, PlaybackService::class.java)),
    ).buildAsync()

    init {
        future.addListener({
            controller = future.get().also { bind(it) }
        }, MoreExecutors.directExecutor())
    }

    private fun bind(c: MediaController) {
        c.addListener(object : Player.Listener {
            override fun onIsPlayingChanged(playing: Boolean) {
                isPlaying.value = playing
            }
        })
    }

    fun play(recording: RecordingPayload) {
        current.value = recording
        val c = controller ?: return
        c.setMediaItem(PlaybackService.mediaItem(recording))
        c.prepare()
        c.play()
        duration.value = (recording.durationSeconds ?: 0) * 1000L
        isPlaying.value = true
    }

    fun toggle() {
        val c = controller ?: return
        if (c.isPlaying) c.pause() else c.play()
        isPlaying.value = c.isPlaying
    }

    fun seek(ms: Long) {
        controller?.seekTo(ms)
        position.value = ms
    }

    fun skip(ms: Long) {
        val c = controller ?: return
        c.seekTo((c.currentPosition + ms).coerceAtLeast(0))
    }

    fun poll() {
        controller?.let {
            position.value = it.currentPosition
            if (it.duration > 0) duration.value = it.duration
            isPlaying.value = it.isPlaying
        }
    }

    fun release() {
        MediaController.releaseFuture(future)
    }
}
