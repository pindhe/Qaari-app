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
                        Label("Sign in to save favorites", systemImage: "heart")
                    } description: {
                        Text("Favorites are available for registered users.")
                    } actions: {
                        Button("Sign in / Sign up") { auth.requireLogin() }
                            .buttonStyle(.borderedProminent)
                            .tint(Theme.green)
                    }
                } else if items.isEmpty {
                    ContentUnavailableView("No favorites yet", systemImage: "heart")
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
            .navigationTitle("Favorites")
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
