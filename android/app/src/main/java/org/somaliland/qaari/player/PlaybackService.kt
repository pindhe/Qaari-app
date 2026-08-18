package org.somaliland.qaari.player

import android.content.Intent
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import org.somaliland.qaari.data.RecordingPayload

class PlaybackService : MediaSessionService() {
    private var session: MediaSession? = null

    override fun onCreate() {
        super.onCreate()
        val player = ExoPlayer.Builder(this).build()
        session = MediaSession.Builder(this, player).build()
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = session

    override fun onDestroy() {
        session?.run {
            player.release()
            release()
        }
        session = null
        super.onDestroy()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        pauseAll()
        super.onTaskRemoved(rootIntent)
    }

    private fun pauseAll() {
        session?.player?.pause()
    }

    companion object {
        fun mediaItem(recording: RecordingPayload): MediaItem {
            return MediaItem.Builder()
                .setMediaId(recording.id)
                .setUri(recording.audioUrl)
                .setMediaMetadata(
                    MediaMetadata.Builder()
                        .setTitle("Juz ${recording.juzNumber}")
                        .setArtist(recording.qaariName)
                        .build(),
                )
                .build()
        }
    }
}
