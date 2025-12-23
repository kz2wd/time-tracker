import { useCallback, useEffect, useState } from "react"

const SCOPES = "https://www.googleapis.com/auth/drive.file"


export function useGoogleDrivePicker(
    clientId: string,
    apiKey: string
) {
    const [ready, setReady] = useState(false)
    const [token, setToken] = useState<string | null>(null)

    // Load gapi
    useEffect(() => {
        gapi.load("client:picker", async () => {
            await gapi.client.init({})
            setReady(true)
        })
    }, [])

    // OAuth
    const signIn = useCallback(() => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: (resp: any) => {
                setToken(resp.access_token)
            },
        })
        tokenClient.requestAccessToken()
    }, [clientId])

    // Picker
    const openPicker = useCallback(() => {
        if (!token) return

        const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
            .setIncludeFolders(true)
            .setSelectFolderEnabled(true)

        const picker = new google.picker.PickerBuilder()
            .setOAuthToken(token)
            .setDeveloperKey(apiKey)
            .addView(view)
            .setCallback((data: any) => {
                if (data.action === google.picker.Action.PICKED) {
                    console.log("Folder ID:", data.docs[0].id)
                }
            })
            .build()

        picker.setVisible(true)
    }, [token, apiKey])

    return { ready, signIn, openPicker }
}
