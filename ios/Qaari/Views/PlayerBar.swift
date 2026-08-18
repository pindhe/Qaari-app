import SwiftUI

struct PlayerBar: View {
    @EnvironmentObject private var player: PlayerManager

    var body: some View {
        if let current = player.current {
            VStack(spacing: 6) {
                Slider(
                    value: Binding(
                        get: { player.progress },
                        set: { player.seek(to: $0) }
                    ),
                    in: 0...max(player.duration, 1)
                )
                .tint(Theme.green)
                HStack {
                    VStack(alignment: .leading) {
                        Text("Juz \(current.juzNumber)").font(.headline)
                        Text(current.qaariName).font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Button { player.skip(by: -15) } label: {
                        Image(systemName: "gobackward.15")
                    }
                    Button { player.toggle() } label: {
                        Image(systemName: player.isPlaying ? "pause.fill" : "play.fill")
                            .font(.title2)
                    }
                    Button { player.skip(by: 15) } label: {
                        Image(systemName: "goforward.15")
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.ultraThinMaterial)
        }
    }
}
