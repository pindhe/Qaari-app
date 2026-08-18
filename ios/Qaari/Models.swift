import Foundation

struct UserProfile: Codable, Equatable {
    let id: String
    let name: String
    let email: String?
    let phone: String?
    let role: String
    let streakCount: Int
    let lastLoginDate: String?
}

struct AuthResponse: Codable {
    let token: String
    let user: UserProfile
}

struct QaariSummary: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let bio: String
    let photoUrl: String?
    let uploadedJuzCount: Int
    let isFavorite: Bool?
}

struct JuzItem: Codable, Identifiable, Hashable {
    var id: Int { juzNumber }
    let juzNumber: Int
    let recordingId: String?
    let durationSeconds: Int?
    let audioUrl: String?
    let available: Bool
}

struct QaariDetail: Codable, Identifiable {
    let id: String
    let name: String
    let bio: String
    let photoUrl: String?
    let uploadedJuzCount: Int
    let isFavorite: Bool
    let juz: [JuzItem]
}

struct RecordingPayload: Codable, Identifiable {
    let id: String
    let qaariId: String
    let qaariName: String
    let qaariPhotoUrl: String?
    let juzNumber: Int
    let audioUrl: String
    let durationSeconds: Int?
}

struct FavoriteItem: Codable, Identifiable {
    let id: String
    let qaariId: String
    let qaariName: String
    let photoUrl: String?
    let juzNumber: Int?
    let recordingId: String?
    let durationSeconds: Int?
    let audioUrl: String?
}

struct SearchResponse: Codable {
    let qaaris: [QaariSummary]
    let juzMatches: [JuzMatch]
}

struct JuzMatch: Codable, Identifiable {
    var id: String { "\(qaariId)-\(juzNumber)" }
    let qaariId: String
    let qaariName: String
    let photoUrl: String?
    let juzNumber: Int
    let recordingId: String
    let durationSeconds: Int?
    let audioUrl: String
}

struct APIError: LocalizedError {
    let message: String
    let code: String?
    var errorDescription: String? { message }
}
