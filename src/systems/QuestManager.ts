import { GameState, Quest, QuestObjective, QuestType } from '../types/World';
import { EventManager, GameEvents } from './EventManager';

export class QuestManager {
    private static instance: QuestManager;
    private gameState!: GameState;

    private constructor() { }

    public static getInstance(): QuestManager {
        if (!QuestManager.instance) {
            QuestManager.instance = new QuestManager();
        }
        return QuestManager.instance;
    }

    public init(gameState: GameState) {
        this.gameState = gameState;

        if (!this.gameState.quests) {
            this.gameState.quests = [];
        }
        if (this.gameState.stocks === undefined) {
            this.gameState.stocks = 0;
        }

        this.checkQuestRefresh();
        this.setupListeners();
    }

    private setupListeners() {
        EventManager.on(GameEvents.ENEMY_DEFEATED, (data: { type: string }) => this.updateProgress('kill_enemy', data.type, 1));
        EventManager.on(GameEvents.ITEM_USED, (data: { type: string }) => this.updateProgress('consume_item', data.type, 1));
        EventManager.on(GameEvents.STATS_CHANGE, (data: { burnout?: number, credits?: number }) => {
            if (data.burnout !== undefined) this.updateProgress('reach_stat', 'burnout', data.burnout);
            if (data.credits !== undefined) this.updateProgress('reach_stat', 'credits', data.credits);
        });
    }

    private updateProgress(objectiveType: QuestObjective, targetId: string, value: number) {
        if (!this.gameState || !this.gameState.quests) return;

        let changed = false;

        this.gameState.quests.forEach(quest => {
            if (quest.isCompleted) return;
            if (quest.objectiveType !== objectiveType) return;
            if (quest.targetId && quest.targetId !== targetId) return;

            // Different logic for 'reach_stat' vs others
            if (objectiveType === 'reach_stat') {
                if (value >= quest.targetValue) {
                    quest.currentValue = value; // or just set to target
                    this.completeQuest(quest);
                    changed = true;
                } else if (value > quest.currentValue) {
                    quest.currentValue = value;
                    changed = true;
                }
            } else {
                // Incremental
                quest.currentValue += value;
                if (quest.currentValue >= quest.targetValue) {
                    quest.currentValue = quest.targetValue;
                    this.completeQuest(quest);
                }
                changed = true;
            }
        });

        if (changed) {
            EventManager.emit(GameEvents.QUEST_UPDATE, { quests: this.gameState.quests });
        }
    }

    private completeQuest(quest: Quest) {
        quest.isCompleted = true;
        this.gameState.stocks += quest.reward;

        EventManager.emit(GameEvents.QUEST_COMPLETE, { quest });
        EventManager.emit(GameEvents.STOCK_CHANGE, { stocks: this.gameState.stocks });
        EventManager.emit(GameEvents.LOG_MESSAGE, `Quest Completed: ${quest.description} (+${quest.reward} Stocks)`);
    }

    public checkQuestRefresh() {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;

        // Check if we need to generate initial quests?
        if (this.gameState.quests.length === 0) {
            this.generateDailyQuests();
            this.generateWeeklyQuest();
            return;
        }

        // Ideally we track 'lastDailyReset' timestamp in GameState too.
        // For now, let's just check if we have active Dailies.
        // If all Dailies are older than 24h? Or just check date.

        // Simpler: Just ensure we have 3 dailies and 1 weekly.
        // If we want real "Daily" logic, we need to store the timestamp of the last reset.
        // Let's assume for this MVP we just ensure capacity.
        // User requested: "Randomizer for both new days".

        // Let's sweep: Remove completed dailies older than 24h?
        // Or just clear all dailies if the 'dateGenerated' is from a previous day.

        const lastQuest = this.gameState.quests[0];
        if (lastQuest) {
            const lastDate = new Date(lastQuest.dateGenerated);
            const today = new Date();

            // If Different Day -> Reset Dailies
            if (lastDate.getDate() !== today.getDate() || lastDate.getMonth() !== today.getMonth()) {
                // Clear old dailies
                this.gameState.quests = this.gameState.quests.filter(q => q.type !== 'daily');
                this.generateDailyQuests();
            }

            // If Different Week (Roughly) -> Reset Weekly
            // Simpler: If generated > 7 days ago
            if (now - lastQuest.dateGenerated > oneWeek) {
                this.gameState.quests = this.gameState.quests.filter(q => q.type !== 'weekly');
                this.generateWeeklyQuest();
            }
        }
    }

    private generateDailyQuests() {
        for (let i = 0; i < 3; i++) {
            const q = this.createRandomQuest('daily');
            this.gameState.quests.push(q);
        }
    }

    private generateWeeklyQuest() {
        const q = this.createRandomQuest('weekly');
        this.gameState.quests.push(q);
    }

    private createRandomQuest(type: QuestType): Quest {
        const id = `quest_${Date.now()}_${Math.random()}`;
        const isWeekly = type === 'weekly';
        // const multiplier = isWeekly ? 5 : 1;

        const templates = [
            {
                desc: "Downsize Interns",
                obj: 'kill_enemy' as QuestObjective,
                target: 'intern',
                baseVal: 5
            },
            {
                desc: "Paper Jam Printers",
                obj: 'kill_enemy' as QuestObjective,
                target: 'printer',
                baseVal: 3
            },
            {
                desc: "Drink Coffee",
                obj: 'consume_item' as QuestObjective,
                target: 'coffee',
                baseVal: 3
            },
            {
                desc: "Reached High Burnout",
                obj: 'reach_stat' as QuestObjective,
                target: 'burnout',
                baseVal: 50,
                fixed: true // Don't scale value too much
            }
        ];

        const t = templates[Math.floor(Math.random() * templates.length)];
        let val = t.fixed ? t.baseVal : t.baseVal * (isWeekly ? 3 : 1);

        // Add some variation
        if (!t.fixed && Math.random() > 0.5) val += Math.floor(Math.random() * 2);

        return {
            id,
            type,
            description: `${t.desc} (${val})`,
            objectiveType: t.obj,
            targetId: t.target,
            targetValue: val,
            currentValue: 0,
            reward: isWeekly ? 5 : 1,
            isCompleted: false,
            dateGenerated: Date.now()
        };
    }
}
