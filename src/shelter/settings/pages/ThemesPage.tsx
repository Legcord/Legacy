const {
    ui: {Button, Header, HeaderTags, ButtonSizes, Divider}
} = shelter;

export function ThemesPage() {
    return (
        <>
            <Header tag={HeaderTags.H1}>Themes</Header>
            <Divider mt mb />
            <Button size={ButtonSizes.MAX} onClick={window.legcord.openThemesWindow}>
                Open Theme Manager
            </Button>
            <Divider mt mb />
            <Button size={ButtonSizes.MAX} onClick={window.legcord.openQuickCssFile}>
                Open Quick CSS file
            </Button>
            <Divider mt mb />
            <Button size={ButtonSizes.MAX} onClick={window.legcord.settings.openThemesFolder}>
                Open themes folder
            </Button>
        </>
    );
}
