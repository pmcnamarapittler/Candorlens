from backend.services.blob_reports import save_report, get_report

TEST_URL = "https://example.com/candorlens-test"

def main():
    fake_report = {
        "url": TEST_URL,
        "summary": "This is a test report stored in Azure Blob Storage.",
        "labels": ["test", "demo"],
    }

    print("Saving report...")
    save_report(TEST_URL, fake_report)
    print("Saved.")

    print("Loading report back...")
    loaded = get_report(TEST_URL)

    if loaded is None:
        print("No report found 😕")
    else:
        print("Loaded report ✅:")
        print(loaded)

if __name__ == "__main__":
    main()