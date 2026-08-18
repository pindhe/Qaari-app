import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss
    @State private var isRegister = false
    @State private var name = ""
    @State private var identifier = ""
    @State private var password = ""
    @State private var error: String?
    @State private var loading = false

    var body: some View {
        NavigationStack {
            Form {
                if isRegister {
                    TextField("Magaca", text: $name)
                }
                TextField("Email ama taleefan", text: $identifier)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                SecureField("Erayga sirta", text: $password)
                if let error {
                    Text(error).foregroundStyle(Theme.red)
                }
                Button(isRegister ? "Isdiiwaangeli" : "Gal") {
                    Task { await submit() }
                }
                .disabled(loading)
                Button(isRegister ? "Horey u leedahay akoon? Gal" : "Akoon ma lihid? Isdiiwaangeli") {
                    isRegister.toggle()
                }
            }
            .navigationTitle(isRegister ? "Isdiiwaangeli" : "Gal")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Xir") { dismiss() }
                }
            }
        }
    }

    private func submit() async {
        loading = true
        error = nil
        do {
            if isRegister {
                try await auth.register(name: name, identifier: identifier, password: password)
            } else {
                try await auth.login(identifier: identifier, password: password)
            }
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}
