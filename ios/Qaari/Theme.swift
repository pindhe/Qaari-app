import SwiftUI

enum Theme {
    static let green = Color(red: 0.043, green: 0.478, blue: 0.243)
    static let greenDark = Color(red: 0.024, green: 0.314, blue: 0.157)
    static let red = Color(red: 0.784, green: 0.063, blue: 0.180)
    static let gold = Color(red: 0.788, green: 0.635, blue: 0.153)
    static let cream = Color(red: 0.965, green: 0.945, blue: 0.910)
    static let ink = Color(red: 0.106, green: 0.141, blue: 0.122)
}

enum Config {
    /// Simulator: localhost. Physical device: replace with your computer's LAN IP.
    static let apiBase = URL(string: "http://127.0.0.1:4000")!
}
