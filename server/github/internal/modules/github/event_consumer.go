package github

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/segmentio/kafka-go"
)

type ServiceEventPayload struct {
	EventID      string `json:"event_id"`
	EventType    string `json:"event_type"`
	ServiceID    string `json:"service_id"`
	UserID       string `json:"user_id"`
	GitHubRepoID int64  `json:"github_repo_id"`
	RepoName     string `json:"repo_name"`
	RepoFullName string `json:"repo_full_name"`
	OwnerLogin   string `json:"owner_login"`
	Branch       string `json:"branch"`
}

type EventConsumer struct {
	reader *kafka.Reader
	repo   Repository
}

func NewEventConsumer(brokers []string, topic, groupID string, repo Repository) *EventConsumer {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        brokers,
		Topic:          topic,
		GroupID:        groupID,
		MinBytes:       10,
		MaxBytes:       10 * 1024 * 1024,
		MaxWait:        1 * time.Second,
		CommitInterval: 1 * time.Second,
		StartOffset:    kafka.FirstOffset,
	})

	return &EventConsumer{
		reader: reader,
		repo:   repo,
	}
}

func (c *EventConsumer) Start(ctx context.Context) error {
	log.Println("[KAFKA GITHUB CONSUMER] Started listening for service repository watch events...")

	for {
		select {
		case <-ctx.Done():
			log.Println("[KAFKA GITHUB CONSUMER] Stopping event consumer loop...")
			return ctx.Err()
		default:
			msg, err := c.reader.FetchMessage(ctx)
			if err != nil {
				if ctx.Err() != nil {
					return nil
				}
				log.Printf("[KAFKA GITHUB CONSUMER ERROR] Failed to fetch message: %v", err)
				time.Sleep(500 * time.Millisecond)
				continue
			}

			if err := c.handleEvent(ctx, msg.Value); err != nil {
				log.Printf("[KAFKA GITHUB CONSUMER ERROR] Failed to handle event: %v", err)
			}

			_ = c.reader.CommitMessages(ctx, msg)
		}
	}
}

func (c *EventConsumer) handleEvent(ctx context.Context, payloadBytes []byte) error {
	var evt ServiceEventPayload
	if err := json.Unmarshal(payloadBytes, &evt); err != nil {
		return err
	}

	log.Printf("[GITHUB EVENT CONSUMER] Received event '%s' for service ID %s (Repo: %s)", evt.EventType, evt.ServiceID, evt.RepoFullName)

	switch evt.EventType {
	case "SERVICE_CREATED", "SERVICE_UPDATED":
		if evt.GitHubRepoID <= 0 {
			return nil
		}
		defaultBranch := evt.Branch
		if defaultBranch == "" {
			defaultBranch = "main"
		}
		tracked := &TrackedRepo{
			ID:            "tracked_" + evt.ServiceID,
			UserID:        evt.UserID,
			GitHubRepoID:  evt.GitHubRepoID,
			RepoName:      evt.RepoName,
			FullName:      evt.RepoFullName,
			OwnerLogin:    evt.OwnerLogin,
			DefaultBranch: defaultBranch,
		}
		return c.repo.TrackRepository(ctx, tracked)

	case "SERVICE_DELETED":
		return c.repo.UntrackRepository(ctx, evt.UserID, "tracked_"+evt.ServiceID)
	}

	return nil
}

func (c *EventConsumer) Close() error {
	if c.reader != nil {
		return c.reader.Close()
	}
	return nil
}
