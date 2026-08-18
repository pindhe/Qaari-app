package org.somaliland.qaari

import android.app.Application
import org.somaliland.qaari.data.SessionStore

class QaariApplication : Application() {
    lateinit var session: SessionStore
        private set

    override fun onCreate() {
        super.onCreate()
        session = SessionStore(this)
    }
}
