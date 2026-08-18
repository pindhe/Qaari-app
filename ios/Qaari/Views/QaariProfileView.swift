import SwiftUI

struct QaariProfileView: View {
    let qaariId: String
    @EnvironmentObject private var auth: AuthStore
    @EnvironmentObject private var player: PlayerManager
    @State private var detail: QaariDetail?
    @State private var favoriteId: String?
    @State private var error: String?

    var body: some View {
        ScrollView {
            if let detail {
                VStack(alignment: .leading, spacing: 16) {
                    HStack(alignment: .top, spacing: 16) {
                        AsyncImage(url: detail.photoUrl.flatMap(URL.init(string:))) { image in
                            image.resizable().scaledToFill()
                        } placeholder: {
                            Theme.green.opacity(0.12)
                        }
                        .frame(width: 96, height: 96)
                        .clipShape(RoundedRectangle(cornerRadius: 18))

                        VStack(alignment: .leading, spacing: 8) {
                            Text(detail.name).font(.title2.bold())
                            Text(detail.bio).font(.subheadline).foregroundStyle(.secondary)
                            Button(detail.isFavorite || favoriteId != nil ? "Ka saar jecel" : "Ku dar jecel") {
                                Task { await toggleFavorite(qaariOnly: true) }
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(Theme.green)
                        }
                    }

                    ForEach(detail.juz) { juz in
                        HStack {
                            VStack(alignment: .leading) {
                                Text("Juz \(juz.juzNumber)").font(.headline)
                                Text(juz.available ? duration(juz.durationSeconds) : "Weli lama soo gelin")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            if juz.available {
                                Button {
                                    Task { await play(juz) }
                                } label: {
                                    Image(systemName: player.current?.juzNumber == juz.juzNumber && player.current?.qaariId == qaariId && player.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                                        .font(.largeTitle)
                                        .foregroundStyle(Theme.green)
                                }
                                Button {
                                    Task { await toggleFavorite(juz: juz.juzNumber) }
                                } label: {
                                    Image(systemName: "heart")
                                }
                                .foregroundStyle(Theme.red)
                            }
                        }
                        .padding()
                        .background(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                }
                .padding()
            } else if let error {
                Text(error).padding()
            } else {
                ProgressView().padding()
            }
        }
        .background(Theme.cream.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private func duration(_ seconds: Int?) -> String {
        guard let seconds else { return "Diyaar" }
        return "\(seconds / 60):\(String(format: "%02d", seconds % 60))"
    }

    private func load() async {
        do {
            struct Envelope: Codable { let qaari: QaariDetail }
            let res: Envelope = try await APIClient.shared.get("/qaaris/\(qaariId)", token: auth.token)
            detail = res.qaari
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func play(_ juz: JuzItem) async {
        do {
            struct Envelope: Codable { let recording: RecordingPayload }
            let res: Envelope = try await APIClient.shared.get("/qaaris/\(qaariId)/juz/\(juz.juzNumber)")
            player.play(res.recording)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func toggleFavorite(qaariOnly: Bool = false, juz: Int? = nil) async {
        guard auth.isLoggedIn, let token = auth.token else {
            auth.requireLogin()
            return
        }
        do {
            var body: [String: Any] = ["qaariId": qaariId]
            if let juz { body["juzNumber"] = juz }
            struct Envelope: Codable { let favorite: Fav }
            struct Fav: Codable { let id: String }
            let res: Envelope = try await APIClient.shared.send("/favorites", method: "POST", body: body, token: token)
            favoriteId = res.favorite.id
            await load()
        } catch {
            self.error = error.localizedDescription
        }
        _ = qaariOnly
    }
}
