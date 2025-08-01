def get_enhanced_data_for_agent(agent_name: str, input_text: str, tenant_id: str):
    from app.services.es_search import (
        query_sales_data,
        query_marketing_dataset,
        query_customer_survey_data,
        query_social_media_dataset,
        query_support_tickets_dataset,
        query_mission_alignment_data,
        query_brand_audit_data,
        query_social_media_engagement_dataset
    )

    def query_business_vitality_combined(query_text):
        sales_data = query_sales_data(query_text=query_text, tenant_id=tenant_id)
        marketing_data = query_marketing_dataset(query_text=query_text, tenant_id=tenant_id)
        return f"""=== SALES DATA ===\n{sales_data}\n\n=== MARKETING DATA ===\n{marketing_data}"""

    def query_customer_analyzer_combined(query_text):
        survey = query_customer_survey_data(query_text=query_text, tenant_id=tenant_id)
        social = query_social_media_dataset(query_text=query_text, tenant_id=tenant_id)
        support = query_support_tickets_dataset(query_text=query_text, tenant_id=tenant_id)
        return f"""=== CUSTOMER SURVEY DATA ===\n{survey}\n\n=== SOCIAL MEDIA DATA ===\n{social}\n\n=== SUPPORT TICKETS DATA ===\n{support}"""

    def query_brand_index_combined(query_text):
        audit = query_brand_audit_data(query_text=query_text, tenant_id=tenant_id)
        engagement = query_social_media_engagement_dataset(query_text=query_text, tenant_id=tenant_id)
        return f"""=== BRAND AUDIT DATA ===\n{audit}\n\n=== SOCIAL MEDIA ENGAGEMENT DATA ===\n{engagement}"""

    def query_strategic_alignment_combined(query_text):
        mission = query_mission_alignment_data(query_text=query_text, tenant_id=tenant_id)
        return f"""=== MISSION ALIGNMENT DATA ===\n{mission}"""

    agent_data_mapping = {
        "business_vitality_agent": lambda: query_business_vitality_combined(input_text),
        "customer_analyzer_agent": lambda: query_customer_analyzer_combined(input_text),
        "brand_index_agent": lambda: query_brand_index_combined(input_text),
        "strategic_alignment_agent": lambda: query_strategic_alignment_combined(input_text),
        "sales_analyzer_agent": lambda: query_sales_data(query_text=input_text, tenant_id=tenant_id),
        "marketing_analyzer_agent": lambda: query_marketing_dataset(query_text=input_text, tenant_id=tenant_id),
        "customer_survey_agent": lambda: query_customer_survey_data(query_text=input_text, tenant_id=tenant_id),
        "social_media_analyzer_agent": lambda: query_social_media_dataset(query_text=input_text, tenant_id=tenant_id),
        "support_tickets_analyzer_agent": lambda: query_support_tickets_dataset(query_text=input_text, tenant_id=tenant_id),
        "website_analyzer_agent": lambda: query_brand_audit_data(query_text=input_text, tenant_id=tenant_id),
        "social_media_engagement_agent": lambda: query_social_media_engagement_dataset(query_text=input_text, tenant_id=tenant_id)
    }

    return agent_data_mapping.get(agent_name, lambda: input_text)()
