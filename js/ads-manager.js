// Gerenciador de Anúncios
class AdsManager {
    constructor() {
        this.adContainers = {
            top: document.querySelector('.ad-container-top'),
            sidebar: document.querySelector('.ad-container-sidebar'),
            bottom: document.querySelector('.ad-container-bottom')
        };
        
        this.adScripts = {
            first: `<script type='text/javascript' src='//pl26742386.profitableratecpm.com/55/0b/50/550b50e6d03ac93a807c12fafc884d89.js'></script>`,
            second: `<script async="async" data-cfasync="false" src="//pl26742415.profitableratecpm.com/2a9dcac609e77d65882802826a4496c7/invoke.js"></script>
                    <div id="container-2a9dcac609e77d65882802826a4496c7"></div>`
        };
        
        this.init();
    }
    
    init() {
        // Adiciona os anúncios aos containers
        this.addAdsToContainers();
        
        // Adiciona listener para redimensionamento da janela
        window.addEventListener('resize', () => this.handleResize());
        
        // Inicializa o layout
        this.handleResize();
    }
    
    addAdsToContainers() {
        // Adiciona o primeiro anúncio no topo
        if (this.adContainers.top) {
            this.adContainers.top.innerHTML = this.adScripts.first;
        }
        
        // Adiciona o segundo anúncio na sidebar
        if (this.adContainers.sidebar) {
            this.adContainers.sidebar.innerHTML = this.adScripts.second;
    }

        // Adiciona o primeiro anúncio no rodapé
        if (this.adContainers.bottom) {
            this.adContainers.bottom.innerHTML = this.adScripts.first;
        }
    }
    
    handleResize() {
        const width = window.innerWidth;
        
        // Ajusta o layout baseado no tamanho da tela
        if (width < 768) {
            // Mobile: Anúncios em sequência
            this.adjustForMobile();
        } else if (width < 992) {
            // Tablet: Layout intermediário
            this.adjustForTablet();
                    } else {
            // Desktop: Layout completo
            this.adjustForDesktop();
                    }
    }
    
    adjustForMobile() {
        // Ajusta espaçamento e margens para mobile
        Object.values(this.adContainers).forEach(container => {
            if (container) {
                container.style.margin = '10px 0';
                container.style.padding = '0';
            }
        });
    }
    
    adjustForTablet() {
        // Ajusta layout para tablet
        Object.values(this.adContainers).forEach(container => {
            if (container) {
                container.style.margin = '15px 0';
                container.style.padding = '0 10px';
            }
        });
    }
    
    adjustForDesktop() {
        // Ajusta layout para desktop
        Object.values(this.adContainers).forEach(container => {
            if (container) {
                container.style.margin = '20px 0';
                container.style.padding = '0 15px';
            }
        });
    }
}

// Inicializa o gerenciador de anúncios quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new AdsManager();
}); 