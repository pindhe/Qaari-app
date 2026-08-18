import Foundation

actor APIClient {
    static let shared = APIClient()

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        return d
    }()

    func get<T: Decodable>(_ path: String, query: [String: String] = [:], token: String? = nil) async throws -> T {
        try await request(path, method: "GET", query: query, token: token)
    }

    func send<T: Decodable>(_ path: String, method: String, body: [String: Any]?, token: String?) async throws -> T {
        try await request(path, method: method, body: body, token: token)
    }

    func sendEmpty(_ path: String, method: String, token: String?) async throws {
        var req = URLRequest(url: makeURL(path, query: [:]))
        req.httpMethod = method
        if let token { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        let (_, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw APIError(message: "Khalad ayaa dhacay", code: nil)
        }
    }

    private func makeURL(_ path: String, query: [String: String]) -> URL {
        var components = URLComponents(url: Config.apiBase, resolvingAgainstBaseURL: false)!
        let trimmed = path.hasPrefix("/") ? path : "/\(path)"
        components.path = trimmed
        if !query.isEmpty {
            components.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        return components.url!
    }

    private func request<T: Decodable>(
        _ path: String,
        method: String,
        query: [String: String] = [:],
        body: [String: Any]? = nil,
        token: String? = nil
    ) async throws -> T {
        var req = URLRequest(url: makeURL(path, query: query))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        if let body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIError(message: "Isku xirka wuu fashilmay", code: nil)
        }
        if !(200..<300).contains(http.statusCode) {
            if let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let message = obj["error"] as? String {
                throw APIError(message: message, code: obj["code"] as? String)
            }
            throw APIError(message: "Khalad ayaa dhacay", code: nil)
        }
        return try decoder.decode(T.self, from: data)
    }
}
