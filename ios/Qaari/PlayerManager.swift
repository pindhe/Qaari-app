import AVFoundation
import Combine
import MediaPlayer

@MainActor
final class PlayerManager: ObservableObject {
    static let shared = PlayerManager()

    @Published var current: RecordingPayload?
    @Published var isPlaying = false
    @Published var progress: Double = 0
    @Published var duration: Double = 0

    private var player: AVPlayer?
    private var timeObserver: Any?

    init() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .spokenAudio)
        try? session.setActive(true)
        setupRemoteCommands()
    }

    func play(_ item: RecordingPayload) {
        if current?.id == item.id {
            toggle()
            return
        }
        current = item
        if let observer = timeObserver {
            player?.removeTimeObserver(observer)
            timeObserver = nil
        }
        guard let url = URL(string: item.audioUrl) else { return }
        let playerItem = AVPlayerItem(url: url)
        let av = AVPlayer(playerItem: playerItem)
        player = av
        duration = Double(item.durationSeconds ?? 0)
        av.play()
        isPlaying = true
        updateNowPlaying()
        timeObserver = av.addPeriodicTimeObserver(
            forInterval: CMTime(seconds: 0.5, preferredTimescale: 600),
            queue: .main
        ) { [weak self] time in
            Task { @MainActor in
                self?.progress = time.seconds
                if let d = self?.player?.currentItem?.duration.seconds, d.isFinite {
                    self?.duration = d
                }
                self?.updateNowPlaying()
            }
        }
    }

    func toggle() {
        guard let player else { return }
        if isPlaying {
            player.pause()
            isPlaying = false
        } else {
            player.play()
            isPlaying = true
        }
        updateNowPlaying()
    }

    func seek(to seconds: Double) {
        player?.seek(to: CMTime(seconds: seconds, preferredTimescale: 600))
    }

    func skip(by seconds: Double) {
        let next = max(0, progress + seconds)
        seek(to: next)
    }

    private func setupRemoteCommands() {
        let center = MPRemoteCommandCenter.shared()
        center.playCommand.addTarget { [weak self] _ in
            Task { @MainActor in self?.toggle(); if self?.isPlaying == false { self?.toggle() } }
            return .success
        }
        center.pauseCommand.addTarget { [weak self] _ in
            Task { @MainActor in if self?.isPlaying == true { self?.toggle() } }
            return .success
        }
        center.skipForwardCommand.preferredIntervals = [15]
        center.skipBackwardCommand.preferredIntervals = [15]
        center.skipForwardCommand.addTarget { [weak self] _ in
            Task { @MainActor in self?.skip(by: 15) }
            return .success
        }
        center.skipBackwardCommand.addTarget { [weak self] _ in
            Task { @MainActor in self?.skip(by: -15) }
            return .success
        }
    }

    private func updateNowPlaying() {
        guard let current else { return }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = [
            MPMediaItemPropertyTitle: "Juz \(current.juzNumber)",
            MPMediaItemPropertyArtist: current.qaariName,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: progress,
            MPMediaItemPropertyPlaybackDuration: duration,
            MPNowPlayingInfoPropertyPlaybackRate: isPlaying ? 1 : 0
        ]
    }
}
