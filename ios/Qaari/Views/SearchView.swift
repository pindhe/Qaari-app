import SwiftUI

struct SearchView: View {
    @State private var query = ""
    @State private var result: SearchResponse?
    @EnvironmentObject private var player: PlayerManager

    var body: some View {
        NavigationStack {
            List {
                if let result {
                    if !result.qaaris.isEmpty {
                        Section("Qaariyada") {
                            ForEach(result.qaaris) { qaari in
                                NavigationLink(value: qaari.id) {
                                    Text(qaari.name)
                                }
                            }
                        }
                    }
                    if !result.juzMatches.isEmpty {
                        Section("Juz") {
                            ForEach(result.juzMatches) { match in
                                Button {
                                    player.play(
                                        RecordingPayload(
                                            id: match.recordingId,
                                            qaariId: match.qaariId,
                                            qaariName: match.qaariName,
                                            qaariPhotoUrl: match.photoUrl,
                                            juzNumber: match.juzNumber,
                                            audioUrl: match.audioUrl,
                                            durationSeconds: match.durationSeconds
                                        )
                                    )
                                } label: {
                                    VStack(alignment: .leading) {
                                        Text("Juz \(match.juzNumber)")
                                        Text(match.qaariName).font(.caption).foregroundStyle(.secondary)
                                    }
                                }
                            }
                        }
                    }
                    if result.qaaris.isEmpty && result.juzMatches.isEmpty && !query.isEmpty {
                        Text("Waxba lama helin")
                    }
                }
            }
            .navigationTitle("Raadi")
            .navigationDestination(for: String.self) { id in
                QaariProfileView(qaariId: id)
            }
            .searchable(text: $query, prompt: "Magaca Qaari ama lambarka Juz")
            .onChange(of: query) { _, value in
                Task { await search(value) }
            }
        }
    }

    private func search(_ value: String) async {
        let q = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !q.isEmpty else {
            result = nil
            return
        }
        result = try? await APIClient.shared.get("/search", query: ["q": q])
    }
}
