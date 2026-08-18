import SwiftUI

struct FavoritesView: View {
    @EnvironmentObject private var auth: AuthStore
    @EnvironmentObject private var player: PlayerManager
    @State private var items: [FavoriteItem] = []

    var body: some View {
        NavigationStack {
            Group {
                if !auth.isLoggedIn {
                    ContentUnavailableView {
                        Label("Gal si aad u kaydiso", systemImage: "heart")
                    } description: {
                        Text("Jecelka waxaa loogu talagalay dadka akoon leh.")
                    } actions: {
                        Button("Gal / Isdiiwaangeli") { auth.requireLogin() }
                            .buttonStyle(.borderedProminent)
                            .tint(Theme.green)
                    }
                } else if items.isEmpty {
                    ContentUnavailableView("Weli ma jiraan kuwa la jecelyahay", systemImage: "heart")
                } else {
                    List(items) { item in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(item.qaariName).font(.headline)
                                Text(item.juzNumber.map { "Juz \($0)" } ?? "Qaari")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            if let url = item.audioUrl, let juz = item.juzNumber, let recId = item.recordingId {
                                Button {
                                    player.play(
                                        RecordingPayload(
                                            id: recId,
                                            qaariId: item.qaariId,
                                            qaariName: item.qaariName,
                                            qaariPhotoUrl: item.photoUrl,
                                            juzNumber: juz,
                                            audioUrl: url,
                                            durationSeconds: item.durationSeconds
                                        )
                                    )
                                } label: {
                                    Image(systemName: "play.circle.fill").font(.title)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Kuwa la jecelyahay")
            .task { await load() }
            .onChange(of: auth.isLoggedIn) { _, _ in
                Task { await load() }
            }
        }
    }

    private func load() async {
        guard let token = auth.token else {
            items = []
            return
        }
        struct Envelope: Codable { let favorites: [FavoriteItem] }
        items = (try? await APIClient.shared.get("/favorites", token: token) as Envelope)?.favorites ?? []
    }
}
