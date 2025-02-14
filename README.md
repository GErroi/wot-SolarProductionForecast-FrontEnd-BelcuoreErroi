# wot-SolarProductionForecast-FrontEnd-BelcuoreErroi
## Descrizione del progetto

Il progetto *Solar Production Forecast* nasce dall’esigenza di sviluppare un modello in grado di prevedere l’energia prodotta da un impianto fotovoltaico, offrendo agli utenti un supporto per una gestione più efficiente e consapevole dei consumi energetici. L'obiettivo è ottimizzare i costi legati all’utilizzo della rete elettrica, privilegiando l’uso di una fonte rinnovabile.

Poiché la radiazione solare varia nel tempo in funzione delle condizioni meteorologiche, la produzione di energia fotovoltaica risulta discontinua e soggetta a fluttuazioni non sempre prevedibili. Per affrontare questa variabilità, il progetto impiega un modello ensemble composto da *Support Vector Regression* (SVR), *Random Forest*, *Ridge Regression* e *Kernel Ridge Regression*. A supporto di questi algoritmi, vengono applicate ulteriori tecniche avanzate di machine learning e data mining per migliorare l’accuratezza delle previsioni. I dati utilizzati vengono raccolti da *open-meteo.com* e da un impianto situato nella città di Lecce.

Le previsioni sono presentate in modo chiaro e intuitivo attraverso una dashboard user-friendly, che consente agli utenti di interpretare facilmente i dati senza la necessità di consultare documentazione aggiuntiva.

## Architettura del sistema

L’architettura del sistema è composta dai seguenti elementi:

1. **Raccolta dati**: alcune API acquisiscono i dati metereologici da *open-meteo.com* e i dati storici della produzione dell'impianto fotovoltaico;
2. **Backend in Python**: pre-elabora i dati e genera previsioni tramite un modello ensemble basato su *SVR*, *Random Forest*, *Ridge Regression* e *Kernel Ridge Regression*;
3. **Archiviazione in MongoDB**: memorizza le previsioni generate dal modello per analisi e consultazioni future;
4. **Dashboard in React**: offre un’interfaccia intuitiva per la visualizzazione interattiva delle previsioni.

## Dashboard  

Questo repository contiene il codice *React* della dashboard, progettata per visualizzare dati in tempo reale e previsioni di produzione solare attraverso un’interfaccia pulita e modulare.  

#### Struttura della Dashboard  

- **Dati in tempo reale**: mostra la produzione attuale dell’impianto e la temperatura ambientale.
- **Previsioni di produzione solare**:
  - Griglia dinamica interattiva con previsioni *giornaliere*, *orarie* e a *intervalli di 15 minuti*; 
  -  **Grafico a linee** per andamento della produzione solare prevista;
  -  **Grafico a barre** che evidenzia le variazioni delle temperature massime e minime previste;
  -  **Grafico a torta** che rappresenta la distribuzione percentuale della produzione nei vari intervalli temporali.

- **Revisione delle prestazioni**: confronto tra dati pianificati ed effettivi  

- **Valutazione del modello**: informazioni tecniche sull’accuratezza e le prestazioni del modello predittivo. 

La dashboard si aggiorna automaticamente **ogni 5 minuti**, generando nuove previsioni e aggiornando i dati per garantire informazioni sempre aggiornate e affidabili.  

## Il backend del sistema è disponibile nel seguente repository: [wot-SolarProductionForecast-Backend-BelcuoreErroi](https://github.com/GErroi/wot-SolarProductionForecast-Backend-BelcuoreErroi)
